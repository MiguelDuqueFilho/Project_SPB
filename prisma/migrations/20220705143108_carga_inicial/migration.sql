-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatGrupoServicos" (
    "GrpServico" VARCHAR(15) NOT NULL,
    "Descricao" VARCHAR(255) NOT NULL,
    "Dominio" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatGrupoServicos_pkey" PRIMARY KEY ("GrpServico")
);

-- CreateTable
CREATE TABLE "CatEventos" (
    "CodEvento" VARCHAR(15) NOT NULL,
    "NomeEvento" VARCHAR(255),
    "Fluxo" VARCHAR(10) NOT NULL,
    "GrpServicoId" VARCHAR(15),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatEventos_pkey" PRIMARY KEY ("CodEvento")
);

-- CreateTable
CREATE TABLE "CatMensagens" (
    "CodMsg" VARCHAR(15) NOT NULL,
    "Tag" VARCHAR(255) NOT NULL,
    "Descricao" VARCHAR(255) NOT NULL,
    "EntidadeOrigem" VARCHAR(20) NOT NULL,
    "EntidadeDestino" VARCHAR(20) NOT NULL,
    "CodEventoId" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatMensagens_pkey" PRIMARY KEY ("CodMsg")
);

-- CreateTable
CREATE TABLE "catMensagemDados" (
    "CodMsg" VARCHAR(15) NOT NULL,
    "CodMsgseq" INTEGER NOT NULL,
    "Tag" VARCHAR(255),
    "NomeCampo" VARCHAR(255),
    "Mult" VARCHAR(10),
    "Ou" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catMensagemDados_pkey" PRIMARY KEY ("CodMsg","CodMsgseq")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "CatEventos" ADD CONSTRAINT "CatEventos_GrpServicoId_fkey" FOREIGN KEY ("GrpServicoId") REFERENCES "CatGrupoServicos"("GrpServico") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatMensagens" ADD CONSTRAINT "CatMensagens_CodEventoId_fkey" FOREIGN KEY ("CodEventoId") REFERENCES "CatEventos"("CodEvento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catMensagemDados" ADD CONSTRAINT "catMensagemDados_CodMsg_fkey" FOREIGN KEY ("CodMsg") REFERENCES "CatMensagens"("CodMsg") ON DELETE RESTRICT ON UPDATE CASCADE;
