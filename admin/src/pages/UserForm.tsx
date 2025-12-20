import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    expirationType: 'days',
    expirationValue: '',
    deviceLimit: 1,
    role: 'USER',
    active: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await api.get(`/api/users/${id}`);
      const user = response.data;
      
      // Determinar tipo de expiração baseado na data
      let expirationType = 'none';
      let expirationValue = '';
      
      if (user.expirationDate) {
        const expDate = new Date(user.expirationDate);
        const now = new Date();
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 365) {
          expirationType = 'days';
          expirationValue = diffDays.toString();
        } else {
          expirationType = 'date';
          expirationValue = expDate.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        username: user.username,
        password: '',
        expirationType: expirationType,
        expirationValue: expirationValue,
        deviceLimit: user.deviceLimit,
        role: user.role,
        active: user.active,
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const updateData: any = {
          username: formData.username,
          expirationDate: calculateExpirationDate(),
          deviceLimit: formData.deviceLimit,
          role: formData.role,
          active: formData.active,
        };
        
        // Só envia senha se foi preenchida
        if (formData.password && formData.password.trim().length > 0) {
          if (formData.password.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres');
            setLoading(false);
            return;
          }
          updateData.password = formData.password;
        }
        
        await api.put(`/api/users/${id}`, updateData);
      } else {
        // Validar senha obrigatória ao criar
        if (!formData.password || formData.password.length < 6) {
          alert('A senha é obrigatória e deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }
        
        const response = await api.post('/api/users', {
          username: formData.username,
          password: formData.password,
          expirationType: formData.expirationType === 'none' ? undefined : formData.expirationType,
          expirationValue: formData.expirationType === 'none' ? undefined : (formData.expirationValue || undefined),
          deviceLimit: formData.deviceLimit,
          role: formData.role,
        });
        if (response.data.generatedPassword) {
          setGeneratedPassword(response.data.generatedPassword);
        }
      }
      navigate('/users');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const calculateExpirationDate = () => {
    if (formData.expirationType === 'none' || !formData.expirationValue) return null;

    const date = new Date();
    if (formData.expirationType === 'days') {
      date.setDate(date.getDate() + parseInt(formData.expirationValue));
    } else if (formData.expirationType === 'hours') {
      date.setHours(date.getHours() + parseInt(formData.expirationValue));
    } else if (formData.expirationType === 'date') {
      return new Date(formData.expirationValue);
    }
    return date;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">
        {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
      </h1>


      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Usuário
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Senha {!isEdit && '(obrigatória, mínimo 6 caracteres)'}
          </label>
          <input
            type="password"
            required={!isEdit}
            minLength={6}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={isEdit ? "Deixe em branco para manter a senha atual" : "Digite a senha do cliente"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Expiração
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={formData.expirationType}
            onChange={(e) => setFormData({ ...formData, expirationType: e.target.value })}
          >
            <option value="days">Dias</option>
            <option value="hours">Horas</option>
            <option value="date">Data Específica</option>
            <option value="none">Sem Expiração</option>
          </select>
        </div>

        {formData.expirationType !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {formData.expirationType === 'date' ? 'Data de Expiração' : 'Valor'}
            </label>
            <input
              type={formData.expirationType === 'date' ? 'date' : 'number'}
              required={formData.expirationType !== 'none'}
              min={formData.expirationType === 'date' ? undefined : 1}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              value={formData.expirationValue}
              onChange={(e) => setFormData({ ...formData, expirationValue: e.target.value })}
              placeholder={formData.expirationType === 'date' ? 'Selecione a data' : formData.expirationType === 'days' ? 'Ex: 30 (para 30 dias)' : 'Ex: 24 (para 24 horas)'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Limite de Dispositivos
          </label>
          <input
            type="number"
            min="1"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={formData.deviceLimit}
            onChange={(e) => setFormData({ ...formData, deviceLimit: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Função
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="USER">Usuário</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        {isEdit && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-300">Ativo</span>
            </label>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

