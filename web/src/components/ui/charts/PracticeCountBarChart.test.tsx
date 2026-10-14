import { render, screen } from '@testing-library/react';

import { PracticeCountBarChart } from './PracticeCountBarChart';

describe('PracticeCountBarChart', () => {
  // recharts' ResponsiveContainer never measures a real size under jsdom, so
  // bars and axis ticks don't render here; assert the surrounding text only.
  it.each([
    {
      entity: 'word' as const,
      total: 9,
      heading: 'Practice count distribution — 9 words total',
      caption: 'Times practiced (per word)',
    },
    {
      entity: 'question' as const,
      total: 0,
      heading: 'Practice count distribution — 0 questions total',
      caption: 'Times practiced (per question)',
    },
  ])(
    'renders the heading and caption for $entity',
    ({ entity, total, heading, caption }) => {
      render(
        <PracticeCountBarChart
          data={[
            { range: '0', count: 4 },
            { range: '1+', count: 5 },
          ]}
          total={total}
          entity={entity}
        />,
      );

      expect(screen.getByText(heading)).toBeInTheDocument();
      expect(screen.getByText(caption)).toBeInTheDocument();
    },
  );
});
