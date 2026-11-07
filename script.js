document.addEventListener("DOMContentLoaded", () => {
    
    // Captura o formulário principal da calculadora
    const formCompra = document.getElementById("form-compra");
    if (!formCompra) return; 

    // Captura dos campos de entrada (Inputs)
    const inputRenda = document.getElementById("renda-mensal");
    const inputFixos = document.getElementById("gastos-fixos");
    const inputVariaveis = document.getElementById("gastos-variaveis");
    const inputValorCompra = document.getElementById("valor-compra");
    const selectParcelas = document.getElementById("num-parcelas");
    const inputJuros = document.getElementById("juros-parcelamento");

    // Captura dos elementos de exibição dos resultados (Outputs)
    const outTotal = document.getElementById("out-total");
    const outDuracao = document.getElementById("out-duracao");
    const outFalta = document.getElementById("out-falta");
    const labelFalta = document.getElementById("label-falta"); 
    const outParcela = document.getElementById("out-parcela");
    const outDetalheParcelas = document.getElementById("out-detalhe-parcelas");
    const outMsgErro = document.getElementById("out-msg-erro");
    const outSobra = document.getElementById("out-sobra");
    const outParcelaDestaque = document.getElementById("out-parcela-destaque");
    
    // Captura dos elementos visuais do gráfico
    const outMeta = document.getElementById("out-meta");
    const outMesesPoupanca = document.getElementById("out-meses-poupanca");
    const chartTitulo = document.getElementById("chart-titulo");
    const barras = document.querySelectorAll(".dynamic-bar");

    // Captura da caixa de mensagem de alerta
    const alertaBox = document.getElementById("alerta-orcamento");
    const alertaTitulo = document.getElementById("alerta-titulo");
    const alertaTexto = document.getElementById("alerta-texto");

    // Converte textos formatados em moeda para números decimais
    const parseValor = (val) => {
        if (!val) return 0;
        if (typeof val === "number") return val;
        let limpo = val.toString().replace(/[^0-9,-]/g, '').replace(',', '.');
        return parseFloat(limpo) || 0;
    };

    // Formata valores numéricos para o padrão de moeda brasileira (R$)
    const formatarMoeda = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Realiza os cálculos financeiros e atualiza a tela
    function executarCalculo() {
        const renda = parseValor(inputRenda.value);
        const fixos = parseValor(inputFixos.value);
        const variaveis = parseValor(inputVariaveis.value);
        const valorCompra = parseValor(inputValorCompra.value);
        const parcelas = parseInt(selectParcelas.value) || 1;
        const jurosPorcentagem = parseValor(inputJuros.value); 
        const taxaJurosMes = jurosPorcentagem / 100; 

        // Calcula a sobra mensal da renda
        const sobraMensal = renda - fixos - variaveis;

        // Calcula a parcela (Tabela Price se houver juros)
        let valorParcela = 0;
        let totalPagar = valorCompra;

        if (taxaJurosMes > 0 && parcelas > 1) {
            valorParcela = valorCompra * (taxaJurosMes * Math.pow(1 + taxaJurosMes, parcelas)) / (Math.pow(1 + taxaJurosMes, parcelas) - 1);
            totalPagar = valorParcela * parcelas;
        } else {
            valorParcela = valorCompra / parcelas;
        }

        const diferencaMensal = sobraMensal - valorParcela;
        const cabeNoOrcamento = diferencaMensal >= 0;

        // Atualiza os valores nos cards
        outTotal.innerText = formatarMoeda(totalPagar);
        outDuracao.innerText = `${parcelas} meses`;
        outParcela.innerText = formatarMoeda(valorParcela);
        outParcelaDestaque.innerText = formatarMoeda(valorParcela);
        outSobra.innerText = formatarMoeda(sobraMensal);
        
        // Altera dinamicamente o título (Sobra x Falta)
        outFalta.innerText = formatarMoeda(Math.abs(diferencaMensal));
        if (cabeNoOrcamento) {
            if (labelFalta) labelFalta.innerText = "Sobra por mês";
            outFalta.innerText = "+ " + outFalta.innerText; 
            outFalta.className = "value neon";
        } else {
            if (labelFalta) labelFalta.innerText = "Falta por mês";
            outFalta.innerText = "- " + outFalta.innerText; 
            outFalta.className = "value red";
        }

        // Exibe detalhe das parcelas
        const ultimaParcela = totalPagar - (valorParcela * (parcelas - 1));
        if (parcelas > 1 && taxaJurosMes === 0 && valorCompra % parcelas !== 0) {
             outDetalheParcelas.innerText = `${parcelas - 1}x de ${formatarMoeda(valorParcela)} + 1x de ${formatarMoeda(ultimaParcela)}`;
        } else {
             outDetalheParcelas.innerText = `${parcelas}x de ${formatarMoeda(valorParcela)}`;
        }

        // Caixa de alerta
        if (cabeNoOrcamento) {
            alertaBox.style.display = "block";
            alertaBox.className = "alert-box alert-success";
            alertaTitulo.innerText = "Pode comprar!";
            alertaTexto.innerText = `A parcela de ${formatarMoeda(valorParcela)} cabe com folga no seu mês, deixando ${formatarMoeda(diferencaMensal)} de margem livre.`;
            outMsgErro.style.display = "none";
        } else {
            alertaBox.style.display = "block";
            alertaBox.className = "alert-box alert-danger";
            alertaTitulo.innerText = "Cuidado!";
            alertaTexto.innerText = `A parcela excede sua sobra mensal em ${formatarMoeda(Math.abs(diferencaMensal))}.`;
            outMsgErro.style.display = "block";
        }

        // Atualiza o gráfico de barras
        atualizarGrafico(sobraMensal, valorCompra);
    }

    // Escuta o clique no botão de submit
    formCompra.addEventListener("submit", (e) => {
        e.preventDefault();
        executarCalculo();

        if (window.innerWidth < 900) {
            document.querySelector(".resultados-container").scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Renderiza as barras sem repetição de meses
    function atualizarGrafico(sobraMensal, valorCompra) {
        outMeta.innerText = formatarMoeda(valorCompra);

        if (sobraMensal <= 0 || valorCompra <= 0) {
            outMesesPoupanca.innerText = "Impossível";
            chartTitulo.innerText = "DINHEIRO ACUMULADO — SEM SOBRA MENSAL OU VALOR INVÁLIDO";
            barras.forEach(barra => {
                barra.style.height = "5%";
                const rotulo = barra.querySelector(".rotulo-barra");
                if (rotulo) rotulo.innerText = "";
            });
            return;
        }

        const mesesParaComprar = Math.ceil(valorCompra / sobraMensal);
        outMesesPoupanca.innerText = `${mesesParaComprar} ${mesesParaComprar === 1 ? 'mês' : 'meses'}`;
        chartTitulo.innerText = `DINHEIRO ACUMULADO — GUARDANDO ${formatarMoeda(sobraMensal)}/MÊS`;

        const numBarras = barras.length;
        
        // Percorre cada uma das 8 barras do HTML sequencialmente
        for (let i = 0; i < numBarras; i++) {
            let mesAtual = i + 1; // Mês 1, Mês 2, Mês 3...
            let rotulo = barras[i].querySelector(".rotulo-barra");

            // Se o mês atual for menor ou igual aos meses necessários para atingir a meta
            if (mesAtual <= mesesParaComprar) {
                let valorAcumulado = sobraMensal * mesAtual;
                let valorExibido = Math.min(valorAcumulado, valorCompra);
                let alturaPorcentagem = (valorExibido / valorCompra) * 100;
                
                if (alturaPorcentagem < 5) alturaPorcentagem = 5;

                barras[i].style.height = `${alturaPorcentagem}%`;
                barras[i].style.opacity = "0.85";

                if (rotulo) {
                    rotulo.innerText = `M${mesAtual}: R$ ${Math.round(valorExibido)}`;
                }
            } else {
                // Se a meta já foi atingida em um mês anterior, reseta as barras excedentes
                barras[i].style.height = "5%";
                barras[i].style.opacity = "0.2";
                if (rotulo) {
                    rotulo.innerText = "";
                }
            }
        }
    }
});
