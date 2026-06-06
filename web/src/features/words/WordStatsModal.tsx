import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Modal } from '../../components/ui/Modal';
import { apiService } from '../../lib/api';
import { WordStatsResponse } from '../../types/api';

interface WordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAMILIARITY_COLORS = {
  Unfamiliar: '#ef4444',
  'Somewhat Familiar': '#eab308',
  Familiar: '#22c55e',
};

export const WordStatsModal: React.FC<WordStatsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<WordStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLoading(true);
    setError(null);
    apiService
      .getWordStats()
      .then(data => setStats(data))
      .catch(() => setError('Failed to load word statistics.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const chartData = stats
    ? [
        { name: 'Unfamiliar', value: stats.familiarity_distribution.red },
        {
          name: 'Somewhat Familiar',
          value: stats.familiarity_distribution.yellow,
        },
        { name: 'Familiar', value: stats.familiarity_distribution.green },
      ]
    : [];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Word Statistics'
      maxWidth='md'
    >
      {loading && (
        <div className='flex h-48 items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500'></div>
        </div>
      )}

      {error && (
        <div className='flex h-48 items-center justify-center text-sm text-red-500'>
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
            Familiarity distribution — {total} words total
          </p>
          <ResponsiveContainer width='100%' height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='43%'
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey='value'
                label={({ percent }) =>
                  (percent ?? 0) > 0
                    ? `${((percent ?? 0) * 100).toFixed(0)}%`
                    : ''
                }
                labelLine={true}
              >
                {chartData.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={
                      FAMILIARITY_COLORS[
                        entry.name as keyof typeof FAMILIARITY_COLORS
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} words`, name]}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>

          <div className='mt-4 grid grid-cols-3 gap-3 text-center'>
            <div className='rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
              <div className='text-xl font-bold text-red-500'>
                {stats.familiarity_distribution.red}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Unfamiliar
              </div>
            </div>
            <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
              <div className='text-xl font-bold text-yellow-500'>
                {stats.familiarity_distribution.yellow}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Somewhat Familiar
              </div>
            </div>
            <div className='rounded-lg bg-green-50 p-3 dark:bg-green-900/20'>
              <div className='text-xl font-bold text-green-500'>
                {stats.familiarity_distribution.green}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Familiar
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
