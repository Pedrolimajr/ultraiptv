import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  blockedUsers: number;
  activeConnections: number;
}

export default function Dashboard() {
  const { } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Carregando...</div>;
  }

  const statCards = [
    { title: 'Total de Usuários', value: stats?.totalUsers || 0, color: 'bg-blue-600' },
    { title: 'Usuários Ativos', value: stats?.activeUsers || 0, color: 'bg-green-600' },
    { title: 'Usuários Expirados', value: stats?.expiredUsers || 0, color: 'bg-yellow-600' },
    { title: 'Usuários Bloqueados', value: stats?.blockedUsers || 0, color: 'bg-red-600' },
    { title: 'Conexões Ativas (24h)', value: stats?.activeConnections || 0, color: 'bg-cyan-600' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} rounded-lg shadow-lg p-6 text-white`}
          >
            <h3 className="text-lg font-semibold mb-2">{stat.title}</h3>
            <p className="text-4xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

