"""
Smart Report Narrative Service
Uses LangChain + Claude/GPT-4 for natural language analysis reports.
Falls back to template-based generation when no LLM API key is configured.
"""

import structlog

from config import ANTHROPIC_API_KEY, OPENAI_API_KEY, NARRATIVE_MAX_TOKENS

logger = structlog.get_logger(service="ecosfer-ai", module="narrative")


def generate_narrative(
    installation_info: dict | None,
    emission_data: list[dict],
    balance_data: list[dict],
    report_type: str = "summary",
    language: str = "tr",
) -> dict:
    """
    Generate a natural language analysis report.

    Args:
        installation_info: Installation metadata
        emission_data: Historical emission records
        balance_data: GHG balance records
        report_type: Type of report (summary, detailed, executive)
        language: Output language (tr, en, de)

    Returns:
        Dictionary with narrative text and metadata
    """
    # Prepare context data
    context = _prepare_context(installation_info, emission_data, balance_data)

    if not context["has_data"]:
        return {
            "status": "no_data",
            "message": "Rapor icin veri bulunamadi",
            "narrative": "",
            "language": language,
            "report_type": report_type,
        }

    # Try LLM-based generation first
    if ANTHROPIC_API_KEY:
        try:
            narrative = _generate_with_anthropic(context, report_type, language)
            return {
                "status": "success",
                "message": "Rapor AI ile olusturuldu",
                "narrative": narrative,
                "language": language,
                "report_type": report_type,
                "model": "claude",
            }
        except Exception as e:
            logger.warning("anthropic_api_error", error=str(e))

    if OPENAI_API_KEY:
        try:
            narrative = _generate_with_openai(context, report_type, language)
            return {
                "status": "success",
                "message": "Rapor AI ile olusturuldu",
                "narrative": narrative,
                "language": language,
                "report_type": report_type,
                "model": "gpt-4",
            }
        except Exception as e:
            logger.warning("openai_api_error", error=str(e))

    # Fallback: template-based generation
    narrative = _generate_template(context, report_type, language)
    return {
        "status": "success",
        "message": "Rapor sablon tabanli olusturuldu (AI API anahtari yapilandirilmamis)",
        "narrative": narrative,
        "language": language,
        "report_type": report_type,
        "model": "template",
    }


def _prepare_context(
    installation_info: dict | None,
    emission_data: list[dict],
    balance_data: list[dict],
) -> dict:
    """Prepare structured context for narrative generation."""
    context: dict = {
        "has_data": bool(emission_data or balance_data),
        "installation": installation_info or {},
    }

    # Aggregate emissions by year
    yearly: dict[int, dict] = {}
    for row in emission_data:
        year = row.get("reportingYear")
        if not year:
            continue
        year = int(year)
        if year not in yearly:
            yearly[year] = {"direct": 0, "indirect": 0, "total": 0, "count": 0}
        yearly[year]["direct"] += float(row.get("directEmissions") or 0)
        yearly[year]["indirect"] += float(row.get("indirectEmissions") or 0)
        yearly[year]["total"] += float(row.get("totalCo2Emissions") or 0)
        yearly[year]["count"] += 1

    context["yearly_emissions"] = dict(sorted(yearly.items()))
    context["years"] = sorted(yearly.keys())
    context["total_records"] = len(emission_data)

    # Balance summary
    balance_summary = []
    for row in balance_data:
        balance_summary.append({
            "year": row.get("reportingYear"),
            "direct": float(row.get("directEmissions") or 0),
            "indirect": float(row.get("indirectEmissions") or 0),
            "total": float(row.get("totalEmissions") or 0),
        })
    context["balance_summary"] = balance_summary

    # Trend calculation
    if len(context["years"]) >= 2:
        first_year = context["years"][0]
        last_year = context["years"][-1]
        first_total = yearly[first_year]["total"]
        last_total = yearly[last_year]["total"]
        if first_total > 0:
            change_pct = (last_total - first_total) / first_total * 100
            context["trend"] = {
                "direction": "increasing" if change_pct > 5 else "decreasing" if change_pct < -5 else "stable",
                "change_pct": round(change_pct, 2),
                "first_year": first_year,
                "last_year": last_year,
            }
        else:
            context["trend"] = {"direction": "unknown", "change_pct": 0}
    else:
        context["trend"] = None

    return context


def _generate_with_anthropic(context: dict, report_type: str, language: str) -> str:
    """Generate narrative using Claude via LangChain."""
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import SystemMessage, HumanMessage

    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        api_key=ANTHROPIC_API_KEY,
        max_tokens=NARRATIVE_MAX_TOKENS,
    )

    system_prompt = _get_system_prompt(language)
    user_prompt = _get_user_prompt(context, report_type, language)

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ])

    return response.content


def _generate_with_openai(context: dict, report_type: str, language: str) -> str:
    """Generate narrative using GPT-4 via LangChain."""
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage

    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=OPENAI_API_KEY,
        max_tokens=NARRATIVE_MAX_TOKENS,
    )

    system_prompt = _get_system_prompt(language)
    user_prompt = _get_user_prompt(context, report_type, language)

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ])

    return response.content


def _get_system_prompt(language: str) -> str:
    prompts = {
        "tr": """Sen bir CBAM (Sinirda Karbon Duzenleme Mekanizmasi) emisyon analiz uzmanisin.
Verilen emisyon verilerini analiz ederek profesyonel, teknik bir rapor olustur.
Rapor Turkce olarak yazilmali ve asagidaki bolumleri icermelidir:
1. Genel Degerlendirme
2. Emisyon Trendleri
3. Onemli Bulgular
4. Oneriler

Tutarli, somut ve veri odakli ol. Gercek sayilari kullan.""",
        "en": """You are a CBAM (Carbon Border Adjustment Mechanism) emissions analysis expert.
Analyze the given emission data and create a professional, technical report.
The report must include the following sections:
1. General Assessment
2. Emission Trends
3. Key Findings
4. Recommendations

Be consistent, concrete, and data-driven. Use actual numbers.""",
        "de": """Sie sind ein CBAM-Emissionsanalyse-Experte.
Analysieren Sie die gegebenen Emissionsdaten und erstellen Sie einen professionellen, technischen Bericht.
Der Bericht muss folgende Abschnitte enthalten:
1. Allgemeine Bewertung
2. Emissionstrends
3. Wichtige Erkenntnisse
4. Empfehlungen

Seien Sie konsistent, konkret und datengetrieben.""",
    }
    return prompts.get(language, prompts["en"])


def _get_user_prompt(context: dict, report_type: str, language: str) -> str:
    inst = context.get("installation", {})
    name = inst.get("installation_name", "Bilinmeyen Tesis")
    company = inst.get("company_name", "")
    country = inst.get("country_name", "")

    lines = [f"Tesis: {name}"]
    if company:
        lines.append(f"Sirket: {company}")
    if country:
        lines.append(f"Ulke: {country}")

    lines.append(f"\nRapor Tipi: {report_type}")
    lines.append(f"Toplam Emisyon Kaydi: {context.get('total_records', 0)}")

    yearly = context.get("yearly_emissions", {})
    if yearly:
        lines.append("\nYillik Emisyon Verileri:")
        for year, data in yearly.items():
            lines.append(
                f"  {year}: Dogrudan={data['direct']:.4f}, Dolayli={data['indirect']:.4f}, "
                f"Toplam={data['total']:.4f} tCO2e ({data['count']} kayit)"
            )

    trend = context.get("trend")
    if trend:
        lines.append(f"\nTrend: {trend['direction']} ({trend['change_pct']}% degisim)")

    balance = context.get("balance_summary", [])
    if balance:
        lines.append("\nGHG Denge Verileri:")
        for b in balance:
            lines.append(
                f"  {b['year']}: Dogrudan={b['direct']:.4f}, Dolayli={b['indirect']:.4f}, Toplam={b['total']:.4f}"
            )

    return "\n".join(lines)


def _generate_template(context: dict, report_type: str, language: str) -> str:
    """Template-based narrative generation (no LLM required)."""
    inst = context.get("installation", {})
    name = inst.get("installation_name", "Bilinmeyen Tesis")
    company = inst.get("company_name", "")
    yearly = context.get("yearly_emissions", {})
    trend = context.get("trend")
    years = context.get("years", [])

    if language == "tr":
        return _template_tr(name, company, yearly, trend, years, report_type)
    elif language == "de":
        return _template_de(name, company, yearly, trend, years, report_type)
    return _template_en(name, company, yearly, trend, years, report_type)


def _template_tr(name, company, yearly, trend, years, report_type) -> str:
    sections = []
    header = f"# {name} - Emisyon Analiz Raporu"
    if company:
        header += f"\n**Sirket:** {company}"
    sections.append(header)

    # General assessment
    sections.append("\n## 1. Genel Degerlendirme")
    if yearly:
        total_all = sum(d["total"] for d in yearly.values())
        sections.append(
            f"{name} tesisi icin {len(years)} yillik emisyon verisi analiz edilmistir. "
            f"Toplam kumulatif emisyon **{total_all:.2f} tCO2e** olarak hesaplanmistir."
        )
    else:
        sections.append("Analiz icin yeterli veri bulunmamaktadir.")

    # Trends
    sections.append("\n## 2. Emisyon Trendleri")
    if trend:
        direction_tr = {"increasing": "artis", "decreasing": "azalis", "stable": "sabit"}.get(trend["direction"], "belirsiz")
        sections.append(
            f"Emisyon trendi **{direction_tr}** yonundedir. "
            f"Incelenen donemde **%{trend['change_pct']}** oraninda degisim gozlemlenmistir."
        )
    if yearly:
        sections.append("\n| Yil | Dogrudan (tCO2e) | Dolayli (tCO2e) | Toplam (tCO2e) |")
        sections.append("|-----|------------------|-----------------|----------------|")
        for year, data in yearly.items():
            sections.append(f"| {year} | {data['direct']:.4f} | {data['indirect']:.4f} | {data['total']:.4f} |")

    # Findings
    sections.append("\n## 3. Onemli Bulgular")
    findings = []
    if len(years) >= 2 and yearly:
        last = yearly[years[-1]]
        prev = yearly[years[-2]]
        if prev["total"] > 0:
            yoy_change = (last["total"] - prev["total"]) / prev["total"] * 100
            findings.append(f"- Son yilda emisyonlar **%{yoy_change:.1f}** oraninda degismistir ({years[-2]} -> {years[-1]}).")
        if last["indirect"] > last["direct"]:
            findings.append("- Dolayli emisyonlar dogrudan emisyonlardan yuksektir. Enerji verimliligi iyilestirmeleri oncelikli olmalidir.")
        else:
            findings.append("- Dogrudan emisyonlar baskindir. Proses optimizasyonu ve yakit degisikligi degerlendirilmelidir.")
    if not findings:
        findings.append("- Detayli bulgu icin daha fazla veri gerekmektedir.")
    sections.append("\n".join(findings))

    # Recommendations
    sections.append("\n## 4. Oneriler")
    sections.append(
        "- Emisyon izleme suresinin artirilmasi ve veri kalitesinin iyilestirilmesi onerilir.\n"
        "- CBAM beyanname sureci icin AB varsayilan deger tablolari ile karsilastirma yapilmalidir.\n"
        "- Yuksek emisyonlu kaynak akimlari icin alternatif uretim yontemleri degerlendirilmelidir."
    )

    sections.append(f"\n---\n*Bu rapor Ecosfer SKDM Platform v2.0 tarafindan otomatik olusturulmustur.*")
    return "\n".join(sections)


def _template_en(name, company, yearly, trend, years, report_type) -> str:
    sections = []
    header = f"# {name} - Emission Analysis Report"
    if company:
        header += f"\n**Company:** {company}"
    sections.append(header)

    sections.append("\n## 1. General Assessment")
    if yearly:
        total_all = sum(d["total"] for d in yearly.values())
        sections.append(
            f"Emission data for {len(years)} year(s) has been analyzed for installation {name}. "
            f"Total cumulative emissions: **{total_all:.2f} tCO2e**."
        )

    sections.append("\n## 2. Emission Trends")
    if trend:
        sections.append(f"The emission trend is **{trend['direction']}** with a **{trend['change_pct']}%** change.")
    if yearly:
        sections.append("\n| Year | Direct (tCO2e) | Indirect (tCO2e) | Total (tCO2e) |")
        sections.append("|------|----------------|------------------|---------------|")
        for year, data in yearly.items():
            sections.append(f"| {year} | {data['direct']:.4f} | {data['indirect']:.4f} | {data['total']:.4f} |")

    sections.append("\n## 3. Key Findings")
    sections.append("- Detailed analysis requires additional data points for meaningful insights.")

    sections.append("\n## 4. Recommendations")
    sections.append(
        "- Increase monitoring frequency and improve data quality.\n"
        "- Compare with EU default value tables for CBAM declaration.\n"
        "- Evaluate alternative production methods for high-emission source streams."
    )

    sections.append(f"\n---\n*This report was automatically generated by Ecosfer SKDM Platform v2.0.*")
    return "\n".join(sections)


def _template_de(name, company, yearly, trend, years, report_type) -> str:
    sections = []
    header = f"# {name} - Emissionsanalysebericht"
    if company:
        header += f"\n**Unternehmen:** {company}"
    sections.append(header)

    sections.append("\n## 1. Allgemeine Bewertung")
    if yearly:
        total_all = sum(d["total"] for d in yearly.values())
        sections.append(
            f"Emissionsdaten fur {len(years)} Jahr(e) wurden fur die Anlage {name} analysiert. "
            f"Gesamtemissionen: **{total_all:.2f} tCO2e**."
        )

    sections.append("\n## 2. Emissionstrends")
    if trend:
        dir_de = {"increasing": "steigend", "decreasing": "sinkend", "stable": "stabil"}.get(trend["direction"], "unbekannt")
        sections.append(f"Der Emissionstrend ist **{dir_de}** mit einer Veranderung von **{trend['change_pct']}%**.")

    sections.append("\n## 3. Wichtige Erkenntnisse")
    sections.append("- Fur detaillierte Erkenntnisse sind zusatzliche Datenpunkte erforderlich.")

    sections.append("\n## 4. Empfehlungen")
    sections.append(
        "- Uberwachungshaufigkeit erhohen und Datenqualitat verbessern.\n"
        "- Mit EU-Standardwerttabellen fur CBAM-Erklarung vergleichen."
    )

    sections.append(f"\n---\n*Dieser Bericht wurde automatisch von Ecosfer SKDM Platform v2.0 erstellt.*")
    return "\n".join(sections)
