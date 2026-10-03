import re
import json

with open('src/lib/i18n.ts', 'r') as f:
    content = f.read()

translations = {
    'en': {'tab': 'Organizer', 'title': 'Organizer HQ', 'req': 'Requires Attention', 'disp': 'Active Disputes', 'ref': 'Pending Refunds', 'wait': 'on Waitlist', 'kpis': 'KPIs (30 Days)', 'conv': 'Conversion', 'check': 'Check-in', 'reg': 'Registrations', 'rev': 'Gross Rev', 'live': 'Live Events', 'res': 'Resolve Disputes'},
    'de': {'tab': 'Organisator', 'title': 'Organisator-Zentrale', 'req': 'Erfordert Aufmerksamkeit', 'disp': 'Aktive Konflikte', 'ref': 'Ausstehende Rückerstattungen', 'wait': 'auf der Warteliste', 'kpis': 'KPIs (30 Tage)', 'conv': 'Konversion', 'check': 'Check-in', 'reg': 'Registrierungen', 'rev': 'Umsatz', 'live': 'Live-Events', 'res': 'Konflikte lösen'},
    'nl': {'tab': 'Organisator', 'title': 'Organisator HQ', 'req': 'Aandacht vereist', 'disp': 'Actieve Geschillen', 'ref': 'Wachtende Terugbetalingen', 'wait': 'op de Wachtlijst', 'kpis': 'KPIs (30 Dagen)', 'conv': 'Conversie', 'check': 'Check-in', 'reg': 'Registraties', 'rev': 'Bruto Omzet', 'live': 'Live Evenementen', 'res': 'Geschillen oplossen'},
    'es': {'tab': 'Organizador', 'title': 'Sede del Organizador', 'req': 'Requiere Atención', 'disp': 'Disputas Activas', 'ref': 'Reembolsos Pendientes', 'wait': 'en Lista de Espera', 'kpis': 'KPIs (30 Días)', 'conv': 'Conversión', 'check': 'Check-in', 'reg': 'Registros', 'rev': 'Ingresos Brutos', 'live': 'Eventos en Vivo', 'res': 'Resolver Disputas'},
    'ru': {'tab': 'Организатор', 'title': 'Штаб организатора', 'req': 'Требует внимания', 'disp': 'Активные споры', 'ref': 'Ожидающие возвраты', 'wait': 'в листе ожидания', 'kpis': 'KPI (30 дней)', 'conv': 'Конверсия', 'check': 'Чекин', 'reg': 'Регистрации', 'rev': 'Валовый доход', 'live': 'Живые события', 'res': 'Разрешить споры'},
    'fr': {'tab': 'Organisateur', 'title': 'QG Organisateur', 'req': 'Nécessite votre attention', 'disp': 'Litiges Actifs', 'ref': 'Remboursements en attente', 'wait': 'sur Liste d\'attente', 'kpis': 'KPI (30 Jours)', 'conv': 'Conversion', 'check': 'Check-in', 'reg': 'Inscriptions', 'rev': 'Revenu Brut', 'live': 'Événements en direct', 'res': 'Résoudre les Litiges'},
    'ko': {'tab': '주최자', 'title': '주최자 본부', 'req': '주의 필요', 'disp': '진행 중인 분쟁', 'ref': '대기 중인 환불', 'wait': '대기 명단', 'kpis': 'KPI (30일)', 'conv': '전환율', 'check': '체크인', 'reg': '등록', 'rev': '총 수익', 'live': '라이브 이벤트', 'res': '분쟁 해결'},
    'ja': {'tab': '主催者', 'title': '主催者本部', 'req': '要確認', 'disp': '対応中の紛争', 'ref': '保留中の返金', 'wait': 'キャンセル待ち', 'kpis': 'KPI（30日間）', 'conv': 'コンバージョン', 'check': 'チェックイン', 'reg': '登録', 'rev': '総収益', 'live': 'ライブイベント', 'res': '紛争を解決する'},
    'it': {'tab': 'Organizzatore', 'title': 'QG Organizzatore', 'req': 'Richiede Attenzione', 'disp': 'Controversie Attive', 'ref': 'Rimborsi in Sospeso', 'wait': 'in Lista d\'Attesa', 'kpis': 'KPI (30 Giorni)', 'conv': 'Conversione', 'check': 'Check-in', 'reg': 'Registrazioni', 'rev': 'Ricavo Lordo', 'live': 'Eventi dal Vivo', 'res': 'Risolvi Controversie'},
    'pt-PT': {'tab': 'Organizador', 'title': 'Sede do Organizador', 'req': 'Requer Atenção', 'disp': 'Disputas Ativas', 'ref': 'Reembolsos Pendentes', 'wait': 'em Lista de Espera', 'kpis': 'KPIs (30 Dias)', 'conv': 'Conversão', 'check': 'Check-in', 'reg': 'Inscrições', 'rev': 'Receita Bruta', 'live': 'Eventos ao Vivo', 'res': 'Resolver Disputas'},
    'pt-BR': {'tab': 'Organizador', 'title': 'Sede do Organizador', 'req': 'Requer Atenção', 'disp': 'Disputas Ativas', 'ref': 'Reembolsos Pendentes', 'wait': 'em Lista de Espera', 'kpis': 'KPIs (30 Dias)', 'conv': 'Conversão', 'check': 'Check-in', 'reg': 'Inscrições', 'rev': 'Receita Bruta', 'live': 'Eventos ao Vivo', 'res': 'Resolver Disputas'}
}

# Update the content
for lang, t in translations.items():
    # 1. Add 'organizer' to tabs
    pattern_tabs = r"({}:\s*{{[^}}]*tabs:\s*{{[^}}]*profile:\s*'[^']+')".format(lang if lang not in ['pt-PT', 'pt-BR'] else f"'{lang}'")
    replacement_tabs = r"\1, organizer: '" + t['tab'] + "'"
    content = re.sub(pattern_tabs, replacement_tabs, content)
    
    # 2. Add 'organizer' namespace
    pattern_namespace = r"({}:\s*{{[^}}]*translation:\s*{{)".format(lang if lang not in ['pt-PT', 'pt-BR'] else f"'{lang}'")
    org_str = f", organizer: {{ title: '{t['title']}', requiresAttention: '{t['req']}', activeDisputes: '{t['disp']}', pendingRefunds: '{t['ref']}', onWaitlist: '{t['wait']}', kpis: '{t['kpis']}', conversion: '{t['conv']}', checkIn: '{t['check']}', registrations: '{t['reg']}', grossRev: '{t['rev']}', liveEvents: '{t['live']}', resolveDisputes: '{t['res']}' }}"
    replacement_namespace = r"\1\n      " + org_str[2:] + ","
    content = re.sub(pattern_namespace, replacement_namespace, content)

with open('src/lib/i18n.ts', 'w') as f:
    f.write(content)
