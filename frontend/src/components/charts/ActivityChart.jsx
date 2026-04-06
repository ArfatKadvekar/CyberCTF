import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';

export default function ActivityChart({ eventId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAnalytics(eventId);
        setData(response.data.activity);
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
          <CardTitle className="text-primary">Activity Timeline</CardTitle>
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
          <CardTitle className="text-primary">Activity Timeline</CardTitle>
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
        <CardTitle className="text-primary">Submission Activity Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">Hourly breakdown of submissions</p>
      </CardHeader>
      <CardContent className="w-full">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
            <XAxis
              dataKey="time"
              stroke="#666"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.max(0, Math.floor(data.length / 6))}
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: 12 }}
              label={{ value: 'Submissions', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 25, 0.95)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)'
              }}
              labelStyle={{ color: '#00ff88' }}
              formatter={(value) => [value, 'Submissions']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="submissions"
              stroke="#00ff88"
              name="Submissions"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Submissions</p>
            <p className="font-mono text-2xl font-bold text-primary">
              {data.reduce((sum, d) => sum + d.submissions, 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Peak Hour</p>
            <p className="font-mono text-2xl font-bold text-primary">
              {Math.max(...data.map(d => d.submissions))} submissions
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Average per Hour</p>
            <p className="font-mono text-2xl font-bold text-primary">
              {Math.round(data.reduce((sum, d) => sum + d.submissions, 0) / data.length)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
