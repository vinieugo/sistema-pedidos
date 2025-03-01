-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "nomeItem" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "solicitante" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "motivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A Solicitar',
    "dataPreenchimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSolicitacao" TIMESTAMP(3),
    "dataBaixa" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" SERIAL NOT NULL,
    "diasParaArquivar" INTEGER NOT NULL DEFAULT 30,
    "itensPorPagina" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pedido_status_ativo_arquivado_idx" ON "Pedido"("status", "ativo", "arquivado");

-- CreateIndex
CREATE INDEX "Pedido_dataPreenchimento_idx" ON "Pedido"("dataPreenchimento");
