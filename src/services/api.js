import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api'
});

export const getPedidos = async (page = 1, status = null, dataInicial = null, dataFinal = null) => {
  const params = { 
    page,
    ...(Array.isArray(status) ? { status: status.join(',') } : status ? { status } : {}),
    ...(dataInicial && { dataInicial }),
    ...(dataFinal && { dataFinal })
  };
  const response = await api.get('/pedidos', { params });
  return response.data;
};

export const criarPedido = async (pedido) => {
  const response = await api.post('/pedidos', pedido);
  return response.data;
};

export const atualizarPedido = async (id, pedido) => {
  const response = await api.put(`/pedidos/${id}`, pedido);
  return response.data;
};

export const deletarPedido = async (id) => {
  await api.delete(`/pedidos/${id}`);
};

export const getConfiguracoes = async () => {
  const response = await api.get('/configuracoes');
  return response.data;
};

export const atualizarConfiguracoes = async (config) => {
  const response = await api.put('/configuracoes', config);
  return response.data;
};

export const arquivarPedidosAntigos = async () => {
  const response = await api.post('/arquivar-pedidos');
  return response.data;
}; 