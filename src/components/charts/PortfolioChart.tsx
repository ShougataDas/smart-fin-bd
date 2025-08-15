import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import {
    VictoryChart,
    VictoryPie,
    VictoryArea,
    VictoryLine,
    VictoryAxis,
    VictoryTheme,
    VictoryLabel,
    VictoryTooltip,
} from 'victory-native';

import { theme, spacing } from '@/constants/theme';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { Investment, InvestmentType } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - spacing.lg * 2;

interface PortfolioChartProps {
    investments: Investment[];
    type: 'pie' | 'performance' | 'growth';
    title: string;
    height?: number;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
    investments,
    type,
    title,
    height = 250,
}) => {
    const getInvestmentTypeColor = (investmentType: InvestmentType): string => {
        const colors = {
            [InvestmentType.SANCHAYAPATRA]: '#4CAF50',
            [InvestmentType.DPS]: '#2196F3',
            [InvestmentType.FIXED_DEPOSIT]: '#FF9800',
            [InvestmentType.MUTUAL_FUND]: '#9C27B0',
            [InvestmentType.STOCK]: '#F44336',
            [InvestmentType.BOND]: '#607D8B',
        };
        return colors[investmentType] || theme.colors.primary;
    };

    const getInvestmentTypeName = (investmentType: InvestmentType): string => {
        const names = {
            [InvestmentType.SANCHAYAPATRA]: 'সঞ্চয়পত্র',
            [InvestmentType.DPS]: 'DPS',
            [InvestmentType.FIXED_DEPOSIT]: 'ফিক্সড ডিপোজিট',
            [InvestmentType.MUTUAL_FUND]: 'মিউচুয়াল ফান্ড',
            [InvestmentType.STOCK]: 'স্টক',
            [InvestmentType.BOND]: 'বন্ড',
        };
        return names[investmentType] || investmentType;
    };

    const renderPieChart = () => {
        const pieData = investments.map(investment => ({
            x: getInvestmentTypeName(investment.type),
            y: investment.currentValue,
            fill: getInvestmentTypeColor(investment.type),
        }));

        const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

        return (
            <View style={styles.chartContainer}>
                <VictoryPie
                    data={pieData}
                    width={chartWidth}
                    height={height}
                    innerRadius={60}
                    padAngle={3}
                    labelComponent={<VictoryLabel style={{ fontSize: 12, fill: 'white' }} />}
                    labelRadius={({ innerRadius }) => innerRadius as number + 30}
                    colorScale={pieData.map(d => d.fill)}
                />

                {/* Center Label */}
                <View style={styles.centerLabel}>
                    <Text variant="headlineSmall" style={styles.totalValue}>
                        {formatCurrency(totalValue)}
                    </Text>
                    <Text variant="bodySmall" style={styles.totalLabel}>
                        মোট পোর্টফোলিও
                    </Text>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    {pieData.map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.fill }]} />
                            <Text variant="bodySmall" style={styles.legendText}>
                                {item.x}: {formatPercentage(item.y / totalValue)}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderPerformanceChart = () => {
        const performanceData = investments.map(investment => {
            const returnPercentage = ((investment.currentValue - investment.amount) / investment.amount) * 100;
            return {
                x: getInvestmentTypeName(investment.type),
                y: returnPercentage,
                fill: returnPercentage >= 0 ? '#4CAF50' : '#F44336',
            };
        });

        return (
            <View style={styles.chartContainer}>
                <VictoryChart
                    theme={VictoryTheme.material}
                    width={chartWidth}
                    height={height}
                    padding={{ left: 80, top: 20, right: 40, bottom: 60 }}>

                    <VictoryAxis
                        dependentAxis
                        tickFormat={(x) => `${x}%`}
                        style={{
                            tickLabels: { fontSize: 12, fill: theme.colors.onSurface },
                            grid: { stroke: theme.colors.outline, strokeOpacity: 0.3 },
                        }}
                    />

                    <VictoryAxis
                        style={{
                            tickLabels: { fontSize: 10, fill: theme.colors.onSurface, angle: -45 },
                        }}
                    />

                    <VictoryArea
                        data={performanceData}
                        style={{
                            data: {
                                fill: ({ datum }) => datum.fill,
                                fillOpacity: 0.7,
                                stroke: ({ datum }) => datum.fill,
                                strokeWidth: 2,
                            },
                        }}
                        labelComponent={<VictoryTooltip />}
                    />
                </VictoryChart>
            </View>
        );
    };

    const renderGrowthChart = () => {
        // Generate growth projection data
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const growthData = investments.map(investment => {
            const monthlyGrowth = investment.expectedReturn / 12 / 100;
            return {
                name: getInvestmentTypeName(investment.type),
                color: getInvestmentTypeColor(investment.type),
                data: months.map(month => ({
                    x: month,
                    y: investment.amount * Math.pow(1 + monthlyGrowth, month),
                })),
            };
        });

        return (
            <View style={styles.chartContainer}>
                <VictoryChart
                    theme={VictoryTheme.material}
                    width={chartWidth}
                    height={height}
                    padding={{ left: 80, top: 20, right: 40, bottom: 40 }}>

                    <VictoryAxis
                        dependentAxis
                        tickFormat={(x) => `${(x / 1000).toFixed(0)}K`}
                        style={{
                            tickLabels: { fontSize: 12, fill: theme.colors.onSurface },
                            grid: { stroke: theme.colors.outline, strokeOpacity: 0.3 },
                        }}
                    />

                    <VictoryAxis
                        tickFormat={(x) => `${x}M`}
                        style={{
                            tickLabels: { fontSize: 12, fill: theme.colors.onSurface },
                        }}
                    />

                    {growthData.map((series, index) => (
                        <VictoryLine
                            key={index}
                            data={series.data}
                            style={{
                                data: { stroke: series.color, strokeWidth: 3 },
                            }}
                            animate={{
                                duration: 1000,
                                onLoad: { duration: 500 },
                            }}
                        />
                    ))}
                </VictoryChart>

                {/* Growth Legend */}
                <View style={styles.legend}>
                    {growthData.map((series, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: series.color }]} />
                            <Text variant="bodySmall" style={styles.legendText}>
                                {series.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderChart = () => {
        switch (type) {
            case 'pie':
                return renderPieChart();
            case 'performance':
                return renderPerformanceChart();
            case 'growth':
                return renderGrowthChart();
            default:
                return renderPieChart();
        }
    };

    return (
        <Surface style={styles.container} elevation={2}>
            <Text variant="titleLarge" style={styles.title}>
                {title}
            </Text>
            {investments.length > 0 ? (
                renderChart()
            ) : (
                <View style={styles.emptyState}>
                    <Text variant="bodyLarge" style={styles.emptyText}>
                        কোনো বিনিয়োগ তথ্য পাওয়া যায়নি
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtext}>
                        বিনিয়োগ শুরু করুন এবং আপনার পোর্টফোলিও দেখুন
                    </Text>
                </View>
            )}
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: spacing.md,
        borderRadius: theme.roundness,
        backgroundColor: theme.colors.surface,
    },
    title: {
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        textAlign: 'center',
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    chartContainer: {
        alignItems: 'center',
        paddingBottom: spacing.lg,
    },
    centerLabel: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -20 }],
        alignItems: 'center',
    },
    totalValue: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    totalLabel: {
        color: theme.colors.onSurfaceVariant,
        marginTop: spacing.xs,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.md,
        marginBottom: spacing.xs,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.xs,
    },
    legendText: {
        color: theme.colors.onSurface,
        fontSize: 11,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    emptyText: {
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        opacity: 0.7,
    },
});

