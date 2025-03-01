import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './App.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Modal from 'react-modal';
import { 
  getPedidos, 
  criarPedido, 
  atualizarPedido, 
  deletarPedido,
  getConfiguracoes,
  arquivarPedidosAntigos
} from './services/api';

Modal.setAppElement('#root');

function App() {
  const [pedidosAtivos, setPedidosAtivos] = useState([]);
  const [historicoPedidos, setHistoricoPedidos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const [totalPaginasHistorico, setTotalPaginasHistorico] = useState(1);
  const [carregando, setCarregando] = useState(false);

  const [novoPedido, setNovoPedido] = useState({
    nomeItem: '',
    quantidade: '',
    solicitante: '',
    fornecedor: '',
    motivo: ''
  });

  useEffect(() => {
    carregarPedidos();
    carregarHistorico();
  }, [paginaAtual, paginaHistorico]);

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      const response = await getPedidos(paginaAtual, 'A Solicitar');
      setPedidosAtivos(response.pedidos);
      setTotalPaginas(response.pages);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      const response = await getPedidos(paginaHistorico, null, dataInicial, dataFinal);
      setHistoricoPedidos(response.pedidos);
      setTotalPaginasHistorico(response.pages);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await criarPedido(novoPedido);
      setModalAberto(false);
      setNovoPedido({
        nomeItem: '',
        quantidade: '',
        solicitante: '',
        fornecedor: '',
        motivo: ''
      });
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
    }
  };

  const handleSolicitar = async (pedido) => {
    try {
      await atualizarPedido(pedido.id, {
        ...pedido,
        status: 'Solicitado',
        dataSolicitacao: new Date()
      });
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao solicitar pedido:', error);
    }
  };

  const handleBaixar = async (pedido) => {
    try {
      await atualizarPedido(pedido.id, {
        ...pedido,
        status: 'Baixado',
        dataBaixa: new Date()
      });
      carregarPedidos();
      carregarHistorico();
    } catch (error) {
      console.error('Erro ao baixar pedido:', error);
    }
  };

  const handleDeletar = async (id) => {
    try {
      await deletarPedido(id);
      carregarPedidos();
      carregarHistorico();
    } catch (error) {
      console.error('Erro ao deletar pedido:', error);
    }
  };

  const gerarRelatorio = async () => {
    try {
      await arquivarPedidosAntigos();
      carregarHistorico();
      setModalRelatorioAberto(false);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const renderPaginacao = (pagina, totalPaginas, setPagina) => {
    return (
      <div className="pagination">
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            className={`pagination-button ${num === pagina ? 'active' : ''}`}
            onClick={() => setPagina(num)}
          >
            {num}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Sistema de Pedidos</h1>
        <Tabs>
          <TabList>
            <Tab>Pedidos Ativos</Tab>
            <Tab>Histórico</Tab>
          </TabList>

          <TabPanel>
            <button className="new-button" onClick={() => setModalAberto(true)}>
              Novo Pedido
            </button>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Solicitante</th>
                    <th>Fornecedor</th>
                    <th>Motivo</th>
                    <th>Status</th>
                    <th>Data Preenchimento</th>
                    <th>Data Solicitação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosAtivos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>{pedido.nomeItem}</td>
                      <td>{pedido.quantidade}</td>
                      <td>{pedido.solicitante}</td>
                      <td>{pedido.fornecedor}</td>
                      <td>{pedido.motivo}</td>
                      <td>{pedido.status}</td>
                      <td>{formatarData(pedido.dataPreenchimento)}</td>
                      <td>{formatarData(pedido.dataSolicitacao)}</td>
                      <td>
                        {pedido.status === 'A Solicitar' && (
                          <button onClick={() => handleSolicitar(pedido)}>
                            Solicitar
                          </button>
                        )}
                        {pedido.status === 'Solicitado' && (
                          <button onClick={() => handleBaixar(pedido)}>
                            Baixar
                          </button>
                        )}
                        <button onClick={() => handleDeletar(pedido.id)}>
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPaginacao(paginaAtual, totalPaginas, setPaginaAtual)}
          </TabPanel>

          <TabPanel>
            <div className="report-controls">
              <button onClick={() => setModalRelatorioAberto(true)}>
                Gerar Relatório
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Solicitante</th>
                    <th>Fornecedor</th>
                    <th>Motivo</th>
                    <th>Status</th>
                    <th>Data Preenchimento</th>
                    <th>Data Solicitação</th>
                    <th>Data Baixa</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoPedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>{pedido.nomeItem}</td>
                      <td>{pedido.quantidade}</td>
                      <td>{pedido.solicitante}</td>
                      <td>{pedido.fornecedor}</td>
                      <td>{pedido.motivo}</td>
                      <td>{pedido.status}</td>
                      <td>{formatarData(pedido.dataPreenchimento)}</td>
                      <td>{formatarData(pedido.dataSolicitacao)}</td>
                      <td>{formatarData(pedido.dataBaixa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPaginacao(paginaHistorico, totalPaginasHistorico, setPaginaHistorico)}
          </TabPanel>
        </Tabs>

        <Modal
          isOpen={modalAberto}
          onRequestClose={() => setModalAberto(false)}
          className="modal"
          overlayClassName="modal-overlay"
        >
          <h2>Novo Pedido</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item:</label>
              <input
                type="text"
                value={novoPedido.nomeItem}
                onChange={(e) =>
                  setNovoPedido({ ...novoPedido, nomeItem: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Quantidade:</label>
              <input
                type="number"
                value={novoPedido.quantidade}
                onChange={(e) =>
                  setNovoPedido({ ...novoPedido, quantidade: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Solicitante:</label>
              <input
                type="text"
                value={novoPedido.solicitante}
                onChange={(e) =>
                  setNovoPedido({ ...novoPedido, solicitante: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Fornecedor:</label>
              <input
                type="text"
                value={novoPedido.fornecedor}
                onChange={(e) =>
                  setNovoPedido({ ...novoPedido, fornecedor: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Motivo:</label>
              <textarea
                value={novoPedido.motivo}
                onChange={(e) =>
                  setNovoPedido({ ...novoPedido, motivo: e.target.value })
                }
              />
            </div>
            <div className="modal-buttons">
              <button type="submit">Salvar</button>
              <button type="button" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={modalRelatorioAberto}
          onRequestClose={() => setModalRelatorioAberto(false)}
          className="modal"
          overlayClassName="modal-overlay"
        >
          <h2>Gerar Relatório</h2>
          <div className="date-filters">
            <div className="filter-group">
              <label>Data Inicial:</label>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Data Final:</label>
              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-buttons">
            <button onClick={gerarRelatorio}>Gerar PDF</button>
            <button onClick={() => setModalRelatorioAberto(false)}>
              Cancelar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
