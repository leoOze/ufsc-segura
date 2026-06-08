import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LineChart,
  PieChart,
} from 'react-native-chart-kit';
import { getReportStats } from '../../services/api';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 48;

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const monthLabels = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const years = Array.from({ length: 9 }, (_, index) => 2022 + index);

const reportTypes = [
  { id: 'atividadesuspeita', title: 'Atividade suspeita', color: '#f59e0b' },
  { id: 'furto', title: 'Furto', color: '#e11d48' },
  { id: 'assalto', title: 'Assalto', color: '#b91c1c' },
  { id: 'rouboveiculo', title: 'Roubo de veículos', color: '#f97316' },
  { id: 'sequestro', title: 'Sequestro', color: '#6d28d9' },
  { id: 'violenciacontraamulher', title: 'Violência contra a mulher', color: '#c026d3' },
  { id: 'pichacao', title: 'Pichação', color: '#8b5cf6' },
  { id: 'buraco', title: 'Buraco', color: '#92400e' },
  { id: 'problemasnacerca', title: 'Problemas na cerca', color: '#475569' },
  { id: 'vazamento', title: 'Vazamento', color: '#06b6d4' },
  { id: 'alagamento', title: 'Alagamento', color: '#2563eb' },
  { id: 'problemaestrutural', title: 'Problema estrutural', color: '#78716c' },
  { id: 'dark-area', title: 'Local sem luz', color: '#111827' },
  { id: 'gramaalta', title: 'Grama alta', color: '#16a34a' },
  { id: 'outro', title: 'Outro', color: '#14b8a6' },
];

const fallbackType = {
  id: 'desconhecido',
  title: 'Desconhecido',
  color: '#94a3b8',
};

const chartConfig = {
  backgroundGradientFrom: '#f6f6f6',
  backgroundGradientTo: '#f6f6f6',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
  strokeWidth: 3,
  barPercentage: 0.58,
  useShadowColorFromDataset: false,
  propsForBackgroundLines: {
    stroke: '#e5e7eb',
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#111827',
  },
};

function getReportType(typeId) {
  return reportTypes.find((type) => type.id === typeId) || fallbackType;
}

function getReportDate(report) {
  const date = new Date(report.createdAt);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isSameMonth(date, month, year) {
  return date.getMonth() === month && date.getFullYear() === year;
}

function buildPieData(typeCounts) {
  const sortedEntries = typeCounts
    .map((item) => [item.typeId, item.count])
    .sort((first, second) => second[1] - first[1]);
  const topEntries = sortedEntries.slice(0, 5);
  const otherCount = sortedEntries.slice(5).reduce((total, [, count]) => total + count, 0);
  const entries = otherCount > 0 ? [...topEntries, ['outros', otherCount]] : topEntries;

  return entries.map(([typeId, count]) => {
    const type = typeId === 'outros'
      ? { title: 'Outros', color: '#64748b' }
      : getReportType(typeId);

    return {
      name: type.title,
      population: count,
      color: type.color,
      legendFontColor: '#334155',
      legendFontSize: 11,
    };
  });
}

function buildHeatmapValues(dailyCounts, month, year) {
  const countsByDay = dailyCounts.reduce(
    (counts, item) => ({
      ...counts,
      [item.day]: item.count,
    }),
    {}
  );
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateKey = getDateKey(date);

    return {
      date: dateKey,
      day: index + 1,
      count: countsByDay[index + 1] || 0,
    };
  });
}

function buildCalendarCells(heatmapValues, month, year) {
  const firstWeekDay = new Date(year, month, 1).getDay();
  const emptyCells = Array.from({ length: firstWeekDay }, (_, index) => ({
    id: `empty-${index}`,
    isEmpty: true,
  }));

  return [
    ...emptyCells,
    ...heatmapValues.map((value) => ({
      ...value,
      id: value.date,
      isEmpty: false,
    })),
  ];
}

function getHeatmapColor(count, maxCount) {
  if (!count) {
    return '#fee2e2';
  }

  const intensity = maxCount ? count / maxCount : 0;

  if (intensity >= 0.75) {
    return '#991b1b';
  }

  if (intensity >= 0.5) {
    return '#dc2626';
  }

  if (intensity >= 0.25) {
    return '#f87171';
  }

  return '#fecaca';
}

function buildLineData(typeMonthlyCounts, selectedTypeId) {
  const monthlyCounts = Array.from({ length: 12 }, () => 0);

  typeMonthlyCounts.forEach((item) => {
    if (item.typeId !== selectedTypeId) {
      return;
    }

    monthlyCounts[item.month - 1] = item.count;
  });

  return {
    labels: monthLabels,
    datasets: [
      {
        data: monthlyCounts,
        color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };
}

export default function Estatisticas() {
  const currentDate = new Date();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [draftMonth, setDraftMonth] = useState(currentDate.getMonth());
  const [draftYear, setDraftYear] = useState(currentDate.getFullYear());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState(reportTypes[0].id);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const data = await getReportStats({
          month: selectedMonth + 1,
          status: 'all',
          year: selectedYear,
        });
        setStats(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [selectedMonth, selectedYear]);

  const heatmapValues = useMemo(
    () => buildHeatmapValues(stats?.dailyCounts || [], selectedMonth, selectedYear),
    [stats, selectedMonth, selectedYear]
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(heatmapValues, selectedMonth, selectedYear),
    [heatmapValues, selectedMonth, selectedYear]
  );

  const pieData = useMemo(
    () => buildPieData(stats?.typeCounts || []),
    [stats]
  );

  const lineData = useMemo(
    () => buildLineData(stats?.typeMonthlyCounts || [], selectedTypeId),
    [stats, selectedTypeId]
  );

  const selectedType = getReportType(selectedTypeId);
  const maxDayCount = Math.max(...heatmapValues.map((value) => value.count), 0);
  const lineMaxCount = Math.max(...lineData.datasets[0].data, 0);
  const lineSegments = Math.max(1, Math.min(4, lineMaxCount));

  function openPicker() {
    setDraftMonth(selectedMonth);
    setDraftYear(selectedYear);
    setIsPickerOpen(true);
  }

  function confirmPicker() {
    setSelectedMonth(draftMonth);
    setSelectedYear(draftYear);
    setIsPickerOpen(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Estatisticas</Text>

        <Pressable
          style={({ pressed }) => [
            styles.monthButton,
            pressed && styles.monthButtonPressed,
          ]}
          onPress={openPicker}
        >
          <View style={styles.monthButtonCopy}>
            <Text style={styles.monthButtonLabel}>Período analisado</Text>
            <Text style={styles.monthButtonText}>
              {months[selectedMonth]} {selectedYear}
            </Text>
          </View>

          <View style={styles.monthButtonIcon}>
            <Image
              source={require('../../assets/icons/downvote.png')}
              style={styles.monthButtonIconImage}
            />
          </View>
        </Pressable>

        {isLoading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color="#111827" />
            <Text style={styles.statusText}>Carregando estatísticas...</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.statusBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{stats?.monthReports || 0}</Text>
                <Text style={styles.summaryLabel}>reports no mês</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{stats?.totalReports || 0}</Text>
                <Text style={styles.summaryLabel}>reports totais</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Densidade por dia</Text>
              <Text style={styles.chartSubtitle}>
                Dias com mais ocorrências em {months[selectedMonth].toLowerCase()}.
              </Text>
              <View style={styles.calendarHeader}>
                {weekDayLabels.map((label) => (
                  <Text key={label} style={styles.calendarWeekDay}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarCells.map((cell) => {
                  if (cell.isEmpty) {
                    return <View key={cell.id} style={styles.calendarDayEmpty} />;
                  }

                  const backgroundColor = getHeatmapColor(cell.count, maxDayCount);
                  const hasReports = cell.count > 0;

                  return (
                    <View
                      key={cell.id}
                      style={[
                        styles.calendarDay,
                        { backgroundColor },
                        hasReports && styles.calendarDayActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          hasReports && styles.calendarDayTextActive,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      <View
                        style={[
                          styles.calendarDayCountBadge,
                          !hasReports && styles.calendarDayCountBadgeEmpty,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarDayCount,
                            !hasReports && styles.calendarDayCountEmpty,
                          ]}
                        >
                          {cell.count}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.heatmapLegend}>
                <Text style={styles.heatmapLegendText}>Menos</Text>
                <View style={[styles.heatmapLegendSquare, { backgroundColor: '#fee2e2' }]} />
                <View style={[styles.heatmapLegendSquare, { backgroundColor: '#fecaca' }]} />
                <View style={[styles.heatmapLegendSquare, { backgroundColor: '#f87171' }]} />
                <View style={[styles.heatmapLegendSquare, { backgroundColor: '#dc2626' }]} />
                <View style={[styles.heatmapLegendSquare, { backgroundColor: '#991b1b' }]} />
                <Text style={styles.heatmapLegendText}>Mais</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tipos mais frequentes</Text>
              <Text style={styles.chartSubtitle}>
                Proporção das ocorrências registradas no mês selecionado.
              </Text>
              {pieData.length ? (
                <View style={styles.pieChartFrame}>
                  <PieChart
                    data={pieData}
                    width={chartWidth - 34}
                    height={186}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="10"
                    absolute
                  />
                </View>
              ) : (
                <Text style={styles.emptyText}>Sem ocorrências nesse mês.</Text>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Evolução por tipo</Text>
              <Text style={styles.chartSubtitle}>
                {selectedType.title} ao longo de {selectedYear}.
              </Text>

              <View style={styles.typeSelectorFrame}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeSelectorScroll}
                  contentContainerStyle={styles.typeSelector}
                >
                  {reportTypes.map((type) => {
                    const isSelected = type.id === selectedTypeId;

                    return (
                      <Pressable
                        key={type.id}
                        style={[
                          styles.typeChip,
                          isSelected && styles.typeChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedTypeId(type.id);
                        }}
                      >
                        <View
                          style={[
                            styles.typeChipDot,
                            { backgroundColor: type.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.typeChipText,
                            isSelected && styles.typeChipTextSelected,
                          ]}
                        >
                          {type.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <LinearGradient
                  colors={['#f6f6f6', 'rgba(246, 246, 246, 0)']}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.typeSelectorFade, styles.typeSelectorFadeLeft]}
                />
                <LinearGradient
                  colors={['rgba(246, 246, 246, 0)', '#f6f6f6']}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.typeSelectorFade, styles.typeSelectorFadeRight]}
                />
              </View>

              <LineChart
                data={lineData}
                width={chartWidth}
                height={230}
                chartConfig={chartConfig}
                bezier
                fromZero
                segments={lineSegments}
                yAxisInterval={1}
                formatYLabel={(value) => String(Math.round(Number(value)))}
                style={styles.lineChart}
              />
            </View>
          </>
        ) : null}
      </ScrollView>

      {isPickerOpen && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <Pressable
                style={({ pressed }) => [
                  styles.pickerActionButton,
                  pressed && styles.pickerActionButtonPressed,
                ]}
                onPress={() => {
                  setIsPickerOpen(false);
                }}
              >
                <Text style={styles.pickerAction}>Cancelar</Text>
              </Pressable>

              <Text style={styles.pickerTitle}>Selecionar período</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.pickerActionButton,
                  styles.pickerActionButtonDone,
                  pressed && styles.pickerActionButtonPressed,
                ]}
                onPress={confirmPicker}
              >
                <Text style={[styles.pickerAction, styles.pickerActionDone]}>
                  Aplicar
                </Text>
              </Pressable>
            </View>

            <View style={styles.pickerColumns}>
              <ScrollView
                style={styles.pickerColumn}
                contentContainerStyle={styles.pickerColumnContent}
                showsVerticalScrollIndicator={false}
              >
                {months.map((month, index) => {
                  const isSelected = index === draftMonth;

                  return (
                    <Pressable
                      key={month}
                      style={[
                        styles.pickerOption,
                        isSelected && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setDraftMonth(index);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          isSelected && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ScrollView
                style={styles.pickerColumn}
                contentContainerStyle={styles.pickerColumnContent}
                showsVerticalScrollIndicator={false}
              >
                {years.map((year) => {
                  const isSelected = year === draftYear;

                  return (
                    <Pressable
                      key={year}
                      style={[
                        styles.pickerOption,
                        isSelected && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setDraftYear(year);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          isSelected && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },

  page: {
    flex: 1,
  },

  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 110,
  },

  titulo: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 18,
  },

  monthButton: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#f6f6f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },

  monthButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  monthButtonCopy: {
    flex: 1,
  },

  monthButtonLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  monthButtonText: {
    color: '#111827',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },

  monthButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#edf0f4',
    borderWidth: 1,
    borderColor: '#d7dde7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  monthButtonIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  statusBox: {
    backgroundColor: '#f6f6f6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
  },

  statusText: {
    color: '#334155',
    fontWeight: '700',
    marginTop: 8,
  },

  errorText: {
    color: '#d90429',
    fontWeight: '800',
  },

  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    borderRadius: 14,
    padding: 14,
  },

  summaryValue: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },

  chartCard: {
    backgroundColor: '#f6f6f6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },

  chartTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },

  chartSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 10,
  },

  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 24,
    textAlign: 'center',
  },

  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  calendarWeekDay: {
    width: `${100 / 7}%`,
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },

  calendarDay: {
    width: `${100 / 7}%`,
    height: 42,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },

  calendarDayActive: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },

  calendarDayEmpty: {
    width: `${100 / 7}%`,
    height: 42,
  },

  calendarDayText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 13,
    fontWeight: '900',
  },

  calendarDayTextActive: {
    color: '#f8fafc',
  },

  calendarDayCountBadge: {
    position: 'absolute',
    bottom: 5,
    minWidth: 17,
    minHeight: 10,
    borderRadius: 999,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  calendarDayCountBadgeEmpty: {
    backgroundColor: 'rgba(246, 246, 246, 0.7)',
  },

  calendarDayCount: {
    color: '#991b1b',
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '900',
  },

  calendarDayCountEmpty: {
    color: '#94a3b8',
  },

  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 10,
  },

  heatmapLegendText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },

  heatmapLegendSquare: {
    width: 13,
    height: 13,
    borderRadius: 4,
  },

  pieChartFrame: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },

  typeSelectorFrame: {
    position: 'relative',
    marginHorizontal: -14,
    marginBottom: 4,
  },

  typeSelectorScroll: {
    overflow: 'visible',
  },

  typeSelector: {
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 34,
  },

  typeSelectorFade: {
    position: 'absolute',
    top: 0,
    bottom: 10,
    width: 22,
    zIndex: 2,
  },

  typeSelectorFadeLeft: {
    left: 0,
  },

  typeSelectorFadeRight: {
    right: 0,
  },

  typeChip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 8,
    paddingRight: 12,
    backgroundColor: '#f6f6f6',
  },

  typeChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },

  typeChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  typeChipText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },

  typeChipTextSelected: {
    color: '#f6f6f6',
  },

  lineChart: {
    borderRadius: 12,
  },

  pickerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },

  pickerPanel: {
    backgroundColor: '#f6f6f6',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },

  pickerHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  pickerTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },

  pickerActionButton: {
    minWidth: 82,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerActionButtonDone: {
    backgroundColor: '#111827',
  },

  pickerActionButtonPressed: {
    opacity: 0.72,
  },

  pickerAction: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },

  pickerActionDone: {
    color: '#f6f6f6',
  },

  pickerColumns: {
    height: 176,
    flexDirection: 'row',
  },

  pickerColumn: {
    flex: 1,
  },

  pickerColumnContent: {
    paddingVertical: 18,
  },

  pickerOption: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerOptionSelected: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#eef2f7',
  },

  pickerOptionText: {
    color: '#9ca3af',
    fontSize: 19,
    fontWeight: '700',
  },

  pickerOptionTextSelected: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
  },
});
