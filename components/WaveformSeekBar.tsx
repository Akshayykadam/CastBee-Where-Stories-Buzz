import React, { useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaveformSeekBarProps {
    progress: number; // 0 to 1
    duration: number;
    onSeek: (position: number) => void;
    onSeekStart?: () => void;
    onSeekEnd?: () => void;
    height?: number;
    waveColor?: string;
    progressColor?: string;
    barCount?: number;
}

// Generate a static waveform pattern
const generateWaveformData = (count: number, seed: number = 42): number[] => {
    const data: number[] = [];

    for (let i = 0; i < count; i++) {
        const noise = Math.sin(i * 0.5 + seed) * 0.3 +
            Math.sin(i * 1.3 + seed * 2) * 0.2 +
            Math.sin(i * 2.7 + seed * 3) * 0.15;
        let value = 0.3 + Math.abs(noise + 0.5) * 0.7;
        value = Math.max(0.2, Math.min(1, value));
        data.push(value);
    }

    return data;
};

export default function WaveformSeekBar({
    progress,
    duration,
    onSeek,
    onSeekStart,
    onSeekEnd,
    height = 60,
    waveColor = Colors.border,
    progressColor = Colors.accent,
    barCount = 50,
}: WaveformSeekBarProps) {
    const containerWidth = SCREEN_WIDTH - 48;
    const barWidth = (containerWidth / barCount) * 0.6;
    const barGap = (containerWidth / barCount) * 0.4;

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekProgress, setSeekProgress] = useState(0);
    const containerRef = useRef<View>(null);
    const containerLayoutRef = useRef({ x: 0, width: containerWidth });

    const waveformData = useMemo(() => generateWaveformData(barCount, Math.floor(duration) % 100), [barCount, duration]);

    const calculateProgress = (pageX: number): number => {
        const relativeX = pageX - containerLayoutRef.current.x;
        return Math.max(0, Math.min(1, relativeX / containerLayoutRef.current.width));
    };

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt: GestureResponderEvent) => {
            setIsSeeking(true);
            onSeekStart?.();
            const newProgress = calculateProgress(evt.nativeEvent.pageX);
            setSeekProgress(newProgress);
        },

        onPanResponderMove: (evt: GestureResponderEvent) => {
            const newProgress = calculateProgress(evt.nativeEvent.pageX);
            setSeekProgress(newProgress);
        },

        onPanResponderRelease: (evt: GestureResponderEvent) => {
            const finalProgress = calculateProgress(evt.nativeEvent.pageX);
            const newPosition = finalProgress * duration;
            onSeek(newPosition);
            setIsSeeking(false);
            onSeekEnd?.();
        },

        onPanResponderTerminate: () => {
            setIsSeeking(false);
            onSeekEnd?.();
        },
    }), [duration, onSeek, onSeekStart, onSeekEnd]);

    const displayProgress = isSeeking ? seekProgress : progress;
    const progressIndex = Math.floor(displayProgress * barCount);
    const thumbPosition = displayProgress * containerWidth;

    return (
        <View
            ref={containerRef}
            style={[styles.container, { height }]}
            onLayout={(e) => {
                containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    containerLayoutRef.current = { x: pageX, width };
                });
            }}
            {...panResponder.panHandlers}
        >
            {/* Waveform bars */}
            <View style={styles.waveformContainer}>
                {waveformData.map((amplitude, index) => {
                    const isPlayed = index <= progressIndex;
                    const barHeight = amplitude * (height - 20);

                    return (
                        <View
                            key={index}
                            style={[
                                styles.bar,
                                {
                                    width: barWidth,
                                    height: barHeight,
                                    backgroundColor: isPlayed ? progressColor : waveColor,
                                    marginRight: index < barCount - 1 ? barGap : 0,
                                    borderRadius: barWidth / 2,
                                },
                            ]}
                        />
                    );
                })}
            </View>

            {/* Thumb/scrubber */}
            <View
                style={[
                    styles.thumb,
                    {
                        left: thumbPosition - 8,
                        backgroundColor: progressColor,
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    bar: {
        minHeight: 6,
    },
    thumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: Colors.primaryText,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
});
