
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProgressChartProps {
  completed: number;
  pending: number;
}

const COLORS = ['#10b981', '#f59e0b']; // Emerald 500 (Success), Amber 500 (Warning)

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded-md shadow-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
  
    return null;
  };

const ProgressChart: React.FC<ProgressChartProps> = ({ completed, pending }) => {
  const data = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: pending },
  ];
  
  const total = completed + pending;

  if (total === 0) {
      return <p className="text-center text-gray-500">No topics available.</p>
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="text-3xl font-bold fill-gray-800">
            {`${Math.round((completed / total) * 100)}%`}
          </text>
          <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central" className="text-sm fill-gray-500">
            Done
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
