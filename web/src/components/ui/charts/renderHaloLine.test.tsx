import {
  renderHaloLine,
  TREND_LINE_HALO_COLOR,
  TREND_LINE_HALO_WIDTH,
  TREND_LINE_STROKE_WIDTH,
} from './renderHaloLine';

describe('renderHaloLine', () => {
  // recharts' ResponsiveContainer never measures a real size under jsdom, so
  // the lines don't draw paths here; assert on the returned elements instead.
  it.each([
    {
      name: 'with a y-axis id',
      options: {
        dataKey: 'accuracy_rate',
        name: 'Accuracy (%)',
        stroke: '#38bdf8',
        yAxisId: 'right',
      },
    },
    {
      name: 'without a y-axis id',
      options: {
        dataKey: 'improvement_rate',
        name: 'Improvement (%)',
        stroke: '#c084fc',
        yAxisId: undefined,
      },
    },
  ])('returns a hidden halo before the visible line $name', ({ options }) => {
    const [halo, line] = renderHaloLine(options);

    expect(halo.key).toBe(`${options.dataKey}-halo`);
    expect(halo.props).toMatchObject({
      dataKey: options.dataKey,
      yAxisId: options.yAxisId,
      stroke: TREND_LINE_HALO_COLOR,
      strokeWidth: TREND_LINE_HALO_WIDTH,
      connectNulls: true,
      activeDot: false,
      legendType: 'none',
      tooltipType: 'none',
    });
    expect(halo.props).not.toHaveProperty('name');

    expect(line.key).toBe(options.dataKey);
    expect(line.props).toMatchObject({
      dataKey: options.dataKey,
      yAxisId: options.yAxisId,
      stroke: options.stroke,
      strokeWidth: TREND_LINE_STROKE_WIDTH,
      connectNulls: true,
      name: options.name,
    });
  });
});
