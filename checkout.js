const $ = id => document.getElementById(id);
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const so = s => s.replace(/\D/g, "");
let frete = null; // null = a definir

// ---------- Resumo ----------
function resumo() {
  const p = CONFIG.produto;
  $("r-nome").textContent = p.nome;
  $("r-preco").textContent = brl(p.preco);
  $("r-de").textContent = brl(p.precoDe);
  $("r-off").textContent = Math.round((1 - p.preco / p.precoDe) * 100) + "% OFF";
  $("r-prazo").textContent = CONFIG.prazoEntrega;
  $("r-frete").textContent = frete === null ? (so($("cep").value).length === 8 ? "A definir" : "Informe o CEP") : (frete === 0 ? "Grátis" : brl(frete));
  const total = p.preco + (frete || 0);
  $("r-total").textContent = brl(total);
  $("r-parc").textContent = `ou até ${CONFIG.parcelasMax}x de ${brl(total / CONFIG.parcelasMax)} no cartão`;
  return total;
}

// ---------- Máscaras ----------
$("cpf").addEventListener("input", e => {
  let v = so(e.target.value).slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  e.target.value = v;
});
$("cep").addEventListener("input", e => {
  let v = so(e.target.value).slice(0, 8);
  e.target.value = v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v;
  if (v.length === 8) buscaCep(v);
});
$("tel").addEventListener("input", e => {
  let v = so(e.target.value).slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  e.target.value = v;
});
$("uf").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ""); calcFrete(); });

// ---------- CEP (ViaCEP) + frete ----------
function calcFrete() {
  const uf = $("uf").value;
  const t = CONFIG.frete;
  frete = uf in t && t[uf] !== undefined ? t[uf] : t.padrao;
  resumo();
}
async function buscaCep(cep) {
  const m = $("cep").parentElement.querySelector(".msg");
  m.textContent = "Buscando...";
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) throw 0;
    $("rua").value = d.logradouro || $("rua").value;
    $("bairro").value = d.bairro || $("bairro").value;
    $("cidade").value = d.localidade;
    $("uf").value = d.uf;
    m.textContent = "";
    calcFrete();
    $(d.logradouro ? "numero" : "rua").focus();
  } catch {
    m.textContent = "CEP não encontrado. Preencha o endereço manualmente.";
    calcFrete();
  }
}

// ---------- Validação ----------
function cpfValido(c) {
  c = so(c);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += c[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 != c[t]) return false;
  }
  return true;
}
const regras = {
  nome: v => v.trim().split(/\s+/).length >= 2 || "Informe nome e sobrenome",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "E-mail inválido",
  cpf: v => cpfValido(v) || "CPF inválido",
  tel: v => so(v).length >= 10 || "Telefone inválido",
  cep: v => so(v).length === 8 || "CEP inválido",
  rua: v => v.trim() !== "" || "Obrigatório",
  bairro: v => v.trim() !== "" || "Obrigatório",
  numero: v => v.trim() !== "" || "Obrigatório",
  cidade: v => v.trim() !== "" || "Obrigatório",
  uf: v => v.length === 2 || "UF inválida"
};
function valida() {
  let ok = true, primeiro = null;
  for (const [id, fn] of Object.entries(regras)) {
    const el = $(id), r = fn(el.value), m = el.parentElement.querySelector(".msg");
    el.classList.toggle("erro", r !== true);
    if (m) m.textContent = r === true ? "" : r;
    if (r !== true) { ok = false; primeiro = primeiro || el; }
  }
  if (primeiro) primeiro.focus();
  return ok;
}

// ---------- Finalizar ----------
// Ponto de integração: troque pelo seu gateway (Mercado Pago, Stripe, Pagar.me...)
async function finalizarPedido(pedido) {
  if (CONFIG.whatsapp) {
    const t = `Novo pedido: ${pedido.produto}\nNome: ${pedido.cliente.nome}\nCPF: ${pedido.cliente.cpf}\nE-mail: ${pedido.cliente.email}\nTel: ${pedido.cliente.tel}\nEntrega: ${pedido.entrega.rua}, ${pedido.entrega.numero} ${pedido.entrega.comp} - ${pedido.entrega.bairro}, ${pedido.entrega.cidade}/${pedido.entrega.uf} - CEP ${pedido.entrega.cep}\nTotal: ${brl(pedido.total)} (frete: ${pedido.frete === null ? "a definir" : brl(pedido.frete)})`;
    window.location.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
  }
  return pedido;
}
$("form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!valida()) return;
  const b = $("btn"); b.disabled = true; b.textContent = "Processando...";
  const g = id => $(id).value.trim();
  const pedido = {
    produto: CONFIG.produto.nome, valor: CONFIG.produto.preco, frete, total: resumo(),
    cliente: { nome: g("nome"), email: g("email"), cpf: g("cpf"), tel: g("tel") },
    entrega: { cep: g("cep"), rua: g("rua"), numero: g("numero"), comp: g("comp"), bairro: g("bairro"), cidade: g("cidade"), uf: g("uf") }
  };
  await finalizarPedido(pedido);
  $("form").style.display = "none";
  const ok = $("ok"); ok.style.display = "block";
  ok.innerHTML = `<h2><svg class="ic" style="width:1.1em;height:1.1em;color:#2a9d4a;vertical-align:-.15em"><use href="#i-ok"/></svg> Pedido registrado!</h2><p>Obrigado, ${pedido.cliente.nome.split(" ")[0]}.</p><pre>${JSON.stringify(pedido, null, 2)}</pre>`;
  scrollTo(0, 0);
});
resumo();
