document.addEventListener("DOMContentLoaded", () => {
    
    // Função auxiliar universal para tratar entradas numéricas
    const parseValor = (val) => {
        if (val === null || val === undefined || val === "") return 0;
        if (typeof val === "number") return val;
        let str = val.toString().trim();
        str = str.replace(/[R$\s]/g, "");
        if (str.includes(",") && str.includes(".")) {
            str = str.replace(/\./g, "").replace(",", ".");
        } else if (str.includes(",")) {
            str = str.replace(",", ".");
        }
        return parseFloat(str) || 0;
    };

    const formatarMoeda = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ==========================================
    // MÓDULO 1: SIMULADOR DE INVESTIMENTOS
    // ==========================================
    const formSimulador = document.getElementById("form-simulador");
    
    if (formSimulador) {
        const selectTipo = document.getElementById("tipo-investimento");
        const inputAporteInicial = document.getElementById("aporte-inicial");
        const inputAporteMensal = document.getElementById("aporte-mensal");
        const inputTempoMeses = document.getElementById("tempo-meses");
        const inputTaxaJuros = document.getElementById("taxa-juros");

        const outInvestido = document.getElementById("out-investido");
        const outJuros = document.getElementById("out-juros");
        const outPatrimonio = document.getElementById("out-patrimonio");
        const tabelaCorpo = document.getElementById("tabela-corpo");

        if (selectTipo) {
            selectTipo.addEventListener("change", (e) => {
                const taxaSelecionada = e.target.value;
                if (taxaSelecionada !== "0") {
                    inputTaxaJuros.value = taxaSelecionada;
                } else {
                    inputTaxaJuros.value = ""; 
                    inputTaxaJuros.focus();
                }
            });
        }

        // Cálculo de Valor Futuro com Aportes Recorrentes
        function calcularValorNoMes(pv, pmt, iMensal, nMeses) {
            if (nMeses === 0) return pv;
            let fvInicial = pv * Math.pow(1 + iMensal, nMeses);
            let fvMensal = 0;
            if (iMensal > 0) {
                fvMensal = pmt * ((Math.pow(1 + iMensal, nMeses) - 1) / iMensal);
            } else {
                fvMensal = pmt * nMeses;
            }
            return fvInicial + fvMensal;
        }

        formSimulador.addEventListener("submit", (e) => {
            e.preventDefault();

            const aporteInicial = parseValor(inputAporteInicial.value);
            const aporteMensal = parseValor(inputAporteMensal.value);
            const meses = parseInt(inputTempoMeses.value) || 0;
            const taxaAnualPorcentagem = parseValor(inputTaxaJuros.value);

            if (meses <= 0) {
                alert("Por favor, insira um tempo em meses maior que zero.");
                return;
            }

            // Conversão de Taxa Anual (% a.a.) para Mensal equivalente real
            const taxaAnualDecimal = taxaAnualPorcentagem / 100;
            const taxaMensal = taxaAnualDecimal > 0 
                ? Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1 
                : 0;

            const patrimonioFinal = calcularValorNoMes(aporteInicial, aporteMensal, taxaMensal, meses);
            const totalInvestido = aporteInicial + (aporteMensal * meses);
            const jurosGanhos = patrimonioFinal - totalInvestido;

            // Renderiza os valores principais nos cards
            outInvestido.innerText = formatarMoeda(totalInvestido);
            outJuros.innerText = "+ " + formatarMoeda(jurosGanhos);
            outPatrimonio.innerText = formatarMoeda(patrimonioFinal);

            // GERAÇÃO DA TABELA DINÂMICA MÊS A MÊS
            if (tabelaCorpo) {
                tabelaCorpo.innerHTML = ""; // Limpa a tabela anterior

                for (let m = 1; m <= meses; m++) {
                    let patrimonioNoMes = calcularValorNoMes(aporteInicial, aporteMensal, taxaMensal, m);
                    let investidoNoMes = aporteInicial + (aporteMensal * m);
                    let jurosNoMes = patrimonioNoMes - investidoNoMes;

                    let tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>Mês ${m}</strong></td>
                        <td>${formatarMoeda(investidoNoMes)}</td>
                        <td class="text-neon">+ ${formatarMoeda(jurosNoMes)}</td>
                        <td class="text-bold">${formatarMoeda(patrimonioNoMes)}</td>
                    `;
                    tabelaCorpo.appendChild(tr);
                }
            }
        });
    }

    // ==========================================
    // MÓDULO 2: CALCULADORA DE COMPRA
    // ==========================================
    const formCompra = document.getElementById("form-compra");
    
    if (formCompra) {
        const inputRenda = document.getElementById("renda-mensal");
        const inputFixos = document.getElementById("gastos-fixos");
        const inputVariaveis = document.getElementById("gastos-variaveis");
        const inputValorCompra = document.getElementById("valor-compra");
        const selectParcelas = document.getElementById("num-parcelas");
        const inputJuros = document.getElementById("juros-parcelamento");

        const outTotal = document.getElementById("out-total");
        const outDuracao = document.getElementById("out-duracao");
        const outFalta = document.getElementById("out-falta");
        const labelFalta = document.getElementById("label-falta"); 
        const outParcela = document.getElementById("out-parcela");
        const outDetalheParcelas = document.getElementById("out-detalhe-parcelas");
        const outMsgErro = document.getElementById("out-msg-erro");
        const outSobra = document.getElementById("out-sobra");
        const outParcelaDestaque = document.getElementById("out-parcela-destaque");
        
        const mainElem = formCompra.closest("main");
        const barras = mainElem ? mainElem.querySelectorAll(".dynamic-bar") : [];

        const alertaBox = document.getElementById("alerta-orcamento");
        const alertaTitulo = document.getElementById("alerta-titulo");
        const alertaTexto = document.getElementById("alerta-texto");

        function executarCalculo() {
            const renda = parseValor(inputRenda.value);
            const fixos = parseValor(inputFixos.value);
            const variaveis = parseValor(inputVariaveis.value);
            const valorCompra = parseValor(inputValorCompra.value);
            const parcelas = parseInt(selectParcelas.value) || 1;
            const jurosPorcentagem = parseValor(inputJuros.value); 
            const taxaJurosMes = jurosPorcentagem / 100; 

            const sobraMensal = renda - fixos - variaveis;

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

            outTotal.innerText = formatarMoeda(totalPagar);
            outDuracao.innerText = `${parcelas} meses`;
            outParcela.innerText = formatarMoeda(valorParcela);
            outParcelaDestaque.innerText = formatarMoeda(valorParcela);
            outSobra.innerText = formatarMoeda(sobraMensal);
            
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

            const ultimaParcela = totalPagar - (valorParcela * (parcelas - 1));
            if (parcelas > 1 && taxaJurosMes === 0 && valorCompra % parcelas !== 0) {
                outDetalheParcelas.innerText = `${parcelas - 1}x de ${formatarMoeda(valorParcela)} + 1x de ${formatarMoeda(ultimaParcela)}`;
            } else {
                outDetalheParcelas.innerText = `${parcelas}x de ${formatarMoeda(valorParcela)}`;
            }

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

            atualizarGrafico(sobraMensal, valorCompra);
        }

        formCompra.addEventListener("submit", (e) => {
            e.preventDefault();
            executarCalculo();

            if (window.innerWidth < 900) {
                document.querySelector(".resultados-container").scrollIntoView({ behavior: 'smooth' });
            }
        });

        function atualizarGrafico(sobraMensal, valorCompra) {
            const outMeta = document.getElementById("out-meta");
            const outMesesPoupanca = document.getElementById("out-meses-poupanca");
            const chartTitulo = document.getElementById("chart-titulo");
            
            if (outMeta) outMeta.innerText = formatarMoeda(valorCompra);

            if (sobraMensal <= 0 || valorCompra <= 0) {
                if (outMesesPoupanca) outMesesPoupanca.innerText = "Impossível";
                if (chartTitulo) chartTitulo.innerText = "DINHEIRO ACUMULADO — SEM SOBRA MENSAL OU VALOR INVÁLIDO";
                barras.forEach(barra => {
                    barra.style.height = "5%";
                    const rotulo = barra.querySelector(".rotulo-barra");
                    if (rotulo) rotulo.innerText = "";
                });
                return;
            }

            const mesesParaComprar = Math.ceil(valorCompra / sobraMensal);
            if (outMesesPoupanca) outMesesPoupanca.innerText = `${mesesParaComprar} ${mesesParaComprar === 1 ? 'mês' : 'meses'}`;
            if (chartTitulo) chartTitulo.innerText = `DINHEIRO ACUMULADO — GUARDANDO ${formatarMoeda(sobraMensal)}/MÊS`;

            const numBarras = barras.length;
            
            for (let i = 0; i < numBarras; i++) {
                let mesAtual = i + 1;
                let rotulo = barras[i].querySelector(".rotulo-barra");

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
                    barras[i].style.height = "5%";
                    barras[i].style.opacity = "0.2";
                    if (rotulo) {
                        rotulo.innerText = "";
                    }
                }
            }
        }
    }
});