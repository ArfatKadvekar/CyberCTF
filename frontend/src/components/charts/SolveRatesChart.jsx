import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';

export default function SolveRatesChart({ eventId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAnalytics(eventId);
        setData(response.data.solveRates);
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
          <CardTitle className="text-primary">Solve Rates</CardTitle>
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
          <CardTitle className="text-primary">Solve Rates</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
          <p>No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by solve rate ascending for better visualization
  const sortedData = [...data].sort((a, b) => a.percent - b.percent);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader>
        <CardTitle className="text-primary">Challenge Solve Rates</CardTitle>
        <p className="text-sm text-muted-foreground">Percentage of players who solved each challenge</p>
      </CardHeader>
      <CardContent className="w-full">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
            <XAxis
              dataKey="challenge"
              stroke="#666"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: 12 }}
              label={{ value: '% Solved', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 25, 0.95)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)'
              }}
              labelStyle={{ color: '#00ff88' }}
              formatter={(value) => [`${value}%`, 'Solve Rate']}
            />
            <Legend />
            <Bar
              dataKey="percent"
              fill="#00ff88"
              name="Solve Rate (%)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        {/* Stats breakdown */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Challenges</p>
            <p className="font-mono text-2xl font-bold text-primary">{data.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Average Solve Rate</p>
            <p className="font-mono text-2xl font-bold text-primary">
              {Math.round(data.reduce((sum, d) => sum + d.percent, 0) / data.length)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Solves</p>
            <p className="font-mono text-2xl font-bold text-primary">
              {data.reduce((sum, d) => sum + d.solves, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
