const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Configuração do CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rota para favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'API do Sistema de Pedidos' });
});

// Rotas para pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      dataInicial, 
      dataFinal,
      arquivado = false 
    } = req.query;

    const skip = (page - 1) * limit;
    
    const where = {
      arquivado,
      ...(status && {
        status: status.includes(',') ? { in: status.split(',') } : status
      }),
      ...(dataInicial && dataFinal && {
        dataPreenchimento: {
          gte: new Date(dataInicial),
          lte: new Date(dataFinal)
        }
      })
    };

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { dataPreenchimento: 'desc' }
      }),
      prisma.pedido.count({ where })
    ]);

    res.json({
      pedidos,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = await prisma.pedido.create({
      data: req.body
    });
    res.status(201).json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await prisma.pedido.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.pedido.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar pedido' });
  }
});

// Rota para arquivamento automático
app.post('/api/arquivar-pedidos', async (req, res) => {
  try {
    const config = await prisma.configuracao.findFirst();
    const diasParaArquivar = config?.diasParaArquivar || 30;

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasParaArquivar);

    const result = await prisma.pedido.updateMany({
      where: {
        dataBaixa: {
          lt: dataLimite
        },
        arquivado: false
      },
      data: {
        arquivado: true
      }
    });

    res.json({ arquivados: result.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao arquivar pedidos' });
  }
});

// Configurações
app.get('/api/configuracoes', async (req, res) => {
  try {
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({
        data: {
          diasParaArquivar: 30,
          itensPorPagina: 10
        }
      });
    }
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.put('/api/configuracoes', async (req, res) => {
  try {
    const config = await prisma.configuracao.upsert({
      where: { id: 1 },
      update: req.body,
      create: req.body
    });
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Middleware para rotas não encontradas (404) - DEVE VIR DEPOIS DE TODAS AS ROTAS
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware para tratamento de erros - DEVE SER O ÚLTIMO
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
}); 