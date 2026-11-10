// Carrega as variáveis do arquivo .env
require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
// =============================================
// CONFIGURAÇÕES INICIAIS
// =============================================

const app = express();

app.use(express.json());

app.use(express.static("public"));

// Verifica as variáveis de ambiente.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        "Configure SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente."
    );
}

// Conecta ao Supabase.
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// =============================================
// GET — LISTAR TAREFAS
// =============================================

app.get("/api/tarefas", async (req, res) => {

    const { data, error } = await supabase
        .from("tarefas")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Erro ao buscar tarefas:", error.message);

        return res.status(500).json({
            erro: "Não foi possível buscar as tarefas."
        });
    }

    return res.status(200).json(data);

});


// =============================================
// POST — CADASTRAR TAREFA
// =============================================

app.post("/api/tarefas", async (req, res) => {

    const { nome } = req.body || {};

    // Validação do nome.
    if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
            erro: "Informe o nome da tarefa."
        });
    }

    const { data, error } = await supabase
        .from("tarefas")
        .insert({
            nome: nome.trim(),
            concluida: false
        })
        .select()
        .single();

    if (error) {
        console.error("Erro ao cadastrar tarefa:", error.message);

        return res.status(500).json({
            erro: "Não foi possível cadastrar a tarefa."
        });
    }

    return res.status(201).json(data);

});


// =============================================
// PATCH — CONCLUIR OU DESFAZER TAREFA
// =============================================

app.patch("/api/tarefas/:id", async (req, res) => {

    const id = Number(req.params.id);

    // Valida o ID.
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    // Busca a tarefa atual.
    const { data: tarefa, error: erroBusca } = await supabase
        .from("tarefas")
        .select("id, concluida")
        .eq("id", id)
        .maybeSingle();

    if (erroBusca) {
        console.error("Erro ao buscar tarefa:", erroBusca.message);

        return res.status(500).json({
            erro: "Não foi possível buscar a tarefa."
        });
    }

    if (!tarefa) {
        return res.status(404).json({
            erro: "Tarefa não encontrada."
        });
    }

    // Inverte o estado atual.
    const { data, error } = await supabase
        .from("tarefas")
        .update({
            concluida: !tarefa.concluida
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Erro ao atualizar tarefa:", error.message);

        return res.status(500).json({
            erro: "Não foi possível atualizar a tarefa."
        });
    }

    return res.status(200).json(data);

});


// =============================================
// DELETE — EXCLUIR TAREFA
// =============================================

app.delete("/api/tarefas/:id", async (req, res) => {

    const id = Number(req.params.id);

    // Valida o ID.
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    const { data, error } = await supabase
        .from("tarefas")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        console.error("Erro ao excluir tarefa:", error.message);

        return res.status(500).json({
            erro: "Não foi possível excluir a tarefa."
        });
    }

    if (!data) {
        return res.status(404).json({
            erro: "Tarefa não encontrada."
        });
    }

    return res.status(200).json({
        mensagem: "Tarefa excluída com sucesso."
    });

});


// =============================================
// TRATAMENTO DE ERROS
// =============================================

// Trata erros de JSON inválido e erros inesperados.
app.use((err, req, res, next) => {

    console.error("Erro na aplicação:", err.message);

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            erro: "O JSON enviado é inválido."
        });
    }

    return res.status(500).json({
        erro: "Erro interno do servidor."
    });

});


// =============================================
// EXPORTAÇÃO E EXECUÇÃO
// =============================================

// Exporta a aplicação para a Vercel.
module.exports = app;

// Executa localmente na porta 3000.
if (require.main === module) {

    app.listen(3000, () => {
        console.log("Servidor rodando na porta 3000");
    });

}
