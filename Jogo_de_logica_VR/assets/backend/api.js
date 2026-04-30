/**
 * api.js — Camada de comunicação com a API REST (data.php)
 *
 * Uso:
 *   GameAPI.salvarJogador({ nome, fases_concluidas, fase_atual, estrelas, hora_inicial })
 *     .then(({ id, nome, ... }) => { ... });
 *
 *   GameAPI.atualizarJogador(id, { fases_concluidas, fase_atual, estrelas, hora_final })
 *     .then(...);
 *
 *   GameAPI.getJogador(id).then(({ jogador }) => { ... });
 *
 *   GameAPI.getRanking(10).then(({ ranking }) => { ... });
 */

(function (global) {
  'use strict';

  // Detecta automaticamente o caminho correto para data.php
  // conforme se o HTML está na raiz ou dentro de pages/.
  const API_URL = window.location.pathname.toLowerCase().includes('/pages/')
    ? '../service/data.php'
    : 'service/data.php';

  // ── Utilitário interno ──────────────────────────────────────────────────────
  async function request(action, method, body) {
    const url = API_URL + '?action=' + action;

    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(
        'O servidor retornou uma resposta inválida.' +
        (text.trim() ? ' Detalhes: ' + text.trim().slice(0, 300) : '')
      );
    }

    if (!response.ok) {
      throw new Error(data.erro || 'Erro desconhecido na API.');
    }

    return data;
  }

  // ── Endpoints públicos ──────────────────────────────────────────────────────

  /**
   * Cria um novo jogador.
   * @param {{ nome: string, fases_concluidas: number[], fase_atual: number, estrelas: number, hora_inicial: string|null, hora_final: string|null }} dados
   * @returns {Promise<{ sucesso: boolean, id: number, nome: string, fases_concluidas: number[], fase_atual: number, estrelas: number, hora_inicial: string, hora_final: string }>}
   */
  async function salvarJogador(dados) {
    return request('salvar_jogador', 'POST', dados);
  }

  /**
   * Atualiza um jogador existente pelo id.
   * @param {number} id
   * @param {{ fases_concluidas?: number[], fase_atual?: number, estrelas?: number, hora_inicial?: string|null, hora_final?: string|null }} dados
   * @returns {Promise<{ sucesso: boolean, id: number, nome: string, fases_concluidas: number[], fase_atual: number, estrelas: number, hora_inicial: string, hora_final: string }>}
   */
  async function atualizarJogador(id, dados) {
    return request('atualizar_jogador', 'POST', { id, ...dados });
  }

  /**
   * Carrega os dados de um jogador pelo id.
   * @param {number} id
   * @returns {Promise<{ sucesso: boolean, jogador: { id, nome, fases_concluidas, fase_atual, estrelas, hora_inicial, hora_final } }>}
   */
  async function getJogador(id) {
    return request('get_jogador&id=' + encodeURIComponent(id), 'GET');
  }

  /**
   * Retorna o ranking dos jogadores ordenado por estrelas.
   * @param {number} [limite=10]
   * @returns {Promise<{ sucesso: boolean, ranking: Array }>}
   */
  async function getRanking(limite) {
    const l = Number.isInteger(limite) && limite > 0 ? limite : 10;
    return request('ranking&limite=' + l, 'GET');
  }

  // ── Exportação ──────────────────────────────────────────────────────────────
  global.GameAPI = {
    salvarJogador,
    atualizarJogador,
    getJogador,
    getRanking,
  };
})(window);
