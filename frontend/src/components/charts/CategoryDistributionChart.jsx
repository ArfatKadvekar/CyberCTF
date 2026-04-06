import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';

const CATEGORY_COLORS = {
  'Web': '#3b82f6',
  'Crypto': '#10b981',
  'Forensics': '#a855f7',
  'OSINT': '#f59e0b',
  'Misc': '#ec4899',
  'Reverse': '#06b6d4',
  'Pwn': '#ef4444'
};

export default function CategoryDistributionChart({ eventId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAnalytics(eventId);
        setData(response.data.categoryDistribution);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchAnalytics();
    }
  }, [eventId]);

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-primary">Challenge Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-primary">Challenge Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
          <p>No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader>
        <CardTitle className="text-primary">Challenge Distribution by Category</CardTitle>
        <p className="text-sm text-muted-foreground">Breakdown of challenges per category</p>
      </CardHeader>
      <CardContent className="w-full">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, count }) => `${category}: ${count}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 25, 0.95)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)'
              }}
              labelStyle={{ color: '#00ff88' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
