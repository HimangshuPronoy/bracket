import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      organizer: { title: 'Organizer HQ', requiresAttention: 'Requires Attention', activeDisputes: 'Active Disputes', pendingRefunds: 'Pending Refunds', onWaitlist: 'on Waitlist', kpis: 'KPIs (30 Days)', conversion: 'Conversion', checkIn: 'Check-in', registrations: 'Registrations', grossRev: 'Gross Rev', liveEvents: 'Live Events', resolveDisputes: 'Resolve Disputes' },
      tabs: { discover: 'Discover', events: 'My Events', rankings: 'Rankings', profile: 'Profile', organizer: 'Organizer' },
      settings: { title: 'Settings', language: 'Language', system: 'System', notifications: 'Notifications', appearance: 'Appearance', deleteAccount: 'Delete Account', signOut: 'Sign Out', cancelBtn: 'Cancel', selectLanguage: 'Select Language' },
      account: { title: 'Account', email: 'Email', editProfile: 'Edit Profile' },
      discover: { title: 'Discover', searchPlaceholder: 'Find events, leagues, or games...', seeAll: 'See All', featuredEvents: 'Featured Events', onlineTournaments: 'Online Tournaments', upcomingLeagues: 'Upcoming Leagues', localUpcoming: 'Local Upcoming', createEvent: 'Create Event' },
      tags: { featured: 'Featured', online: 'Online', league: 'League', upcoming: 'Upcoming' },
      myEvents: { title: 'My Events', emptyTitle: 'Your Events', emptyDesc: "You haven't registered for any events yet." },
      rankings: { title: 'My Rankings', subtitle: 'Your Top 5 placements across all events. View a tournament\'s page for full placement history.', emptyTitle: 'No rankings yet', emptyDesc: 'Compete in tournaments to earn your spot on the leaderboard!', placing: 'Placing' },
      tournament: { notFound: 'Tournament not found', events: 'Events', entrants: 'Entrants', viewBracket: 'View Bracket ›', registered: "You're registered!", registeredDesc: 'Check your events in the bracket.', registerNow: 'Register Now', placing: 'Placing' },
      register: { title: 'Register', selectEvents: 'Select Events', completeRegistration: 'Complete Registration' },
    }
  },
  de: {
    translation: {
      organizer: { title: 'Organisator-Zentrale', requiresAttention: 'Erfordert Aufmerksamkeit', activeDisputes: 'Aktive Konflikte', pendingRefunds: 'Ausstehende Rückerstattungen', onWaitlist: 'auf der Warteliste', kpis: 'KPIs (30 Tage)', conversion: 'Konversion', checkIn: 'Check-in', registrations: 'Registrierungen', grossRev: 'Umsatz', liveEvents: 'Live-Events', resolveDisputes: 'Konflikte lösen' },
      tabs: { discover: 'Entdecken', events: 'Meine Events', rankings: 'Rangliste', profile: 'Profil', organizer: 'Organisator' },
      settings: { title: 'Einstellungen', language: 'Sprache', system: 'System', notifications: 'Benachrichtigungen', appearance: 'Erscheinungsbild', deleteAccount: 'Konto löschen', signOut: 'Abmelden', cancelBtn: 'Abbrechen', selectLanguage: 'Sprache wählen' },
      account: { title: 'Konto', email: 'E-Mail', editProfile: 'Profil bearbeiten' },
      discover: { title: 'Entdecken', searchPlaceholder: 'Events, Ligen oder Spiele finden...', seeAll: 'Alle sehen', featuredEvents: 'Ausgewählte Events', onlineTournaments: 'Online-Turniere', upcomingLeagues: 'Kommende Ligen', localUpcoming: 'Lokale Events', createEvent: 'Event erstellen' },
      tags: { featured: 'Empfohlen', online: 'Online', league: 'Liga', upcoming: 'Bald' },
      myEvents: { title: 'Meine Events', emptyTitle: 'Deine Events', emptyDesc: 'Du hast dich noch für keine Events angemeldet.' },
      rankings: { title: 'Meine Rangliste', subtitle: 'Deine Top 5 Platzierungen. Sieh dir die Turnierseite für die vollständige Historie an.', emptyTitle: 'Noch keine Ränge', emptyDesc: 'Nimm an Turnieren teil, um in die Rangliste aufzusteigen!', placing: 'Platzierung' },
      tournament: { notFound: 'Turnier nicht gefunden', events: 'Events', entrants: 'Teilnehmer', viewBracket: 'Turnierbaum ›', registered: 'Du bist registriert!', registeredDesc: 'Schau dir deinen Turnierbaum an.', registerNow: 'Jetzt anmelden', placing: 'Platzierung' },
      register: { title: 'Anmelden', selectEvents: 'Events auswählen', completeRegistration: 'Anmeldung abschließen' },
    }
  },
  nl: {
    translation: {
      organizer: { title: 'Organisator HQ', requiresAttention: 'Aandacht vereist', activeDisputes: 'Actieve Geschillen', pendingRefunds: 'Wachtende Terugbetalingen', onWaitlist: 'op de Wachtlijst', kpis: 'KPIs (30 Dagen)', conversion: 'Conversie', checkIn: 'Check-in', registrations: 'Registraties', grossRev: 'Bruto Omzet', liveEvents: 'Live Evenementen', resolveDisputes: 'Geschillen oplossen' },
      tabs: { discover: 'Ontdekken', events: 'Mijn Evenementen', rankings: 'Ranglijsten', profile: 'Profiel', organizer: 'Organisator' },
      settings: { title: 'Instellingen', language: 'Taal', system: 'Systeem', notifications: 'Meldingen', appearance: 'Weergave', deleteAccount: 'Account verwijderen', signOut: 'Uitloggen', cancelBtn: 'Annuleren', selectLanguage: 'Taal selecteren' },
      account: { title: 'Account', email: 'E-mail', editProfile: 'Profiel bewerken' },
      discover: { title: 'Ontdekken', searchPlaceholder: 'Evenementen, competities of spellen zoeken...', seeAll: 'Alles zien', featuredEvents: 'Uitgelichte Evenementen', onlineTournaments: 'Online Toernooien', upcomingLeagues: 'Aankomende Competities', localUpcoming: 'Lokale Evenementen', createEvent: 'Evenement aanmaken' },
      tags: { featured: 'Uitgelicht', online: 'Online', league: 'Competitie', upcoming: 'Binnenkort' },
      myEvents: { title: 'Mijn Evenementen', emptyTitle: 'Jouw Evenementen', emptyDesc: 'Je hebt je nog niet ingeschreven voor evenementen.' },
      rankings: { title: 'Mijn Ranglijst', subtitle: 'Je Top 5 plaatsingen. Bekijk de tornooipagina voor de volledige geschiedenis.', emptyTitle: 'Nog geen ranglijst', emptyDesc: 'Doe mee aan toernooien om op de ranglijst te komen!', placing: 'Plaatsing' },
      tournament: { notFound: 'Toernooi niet gevonden', events: 'Evenementen', entrants: 'Deelnemers', viewBracket: 'Bracket bekijken ›', registered: 'Je bent geregistreerd!', registeredDesc: 'Bekijk je evenementen in de bracket.', registerNow: 'Nu inschrijven', placing: 'Plaatsing' },
      register: { title: 'Inschrijven', selectEvents: 'Evenementen selecteren', completeRegistration: 'Inschrijving voltooien' },
    }
  },
  es: {
    translation: {
      organizer: { title: 'Sede del Organizador', requiresAttention: 'Requiere Atención', activeDisputes: 'Disputas Activas', pendingRefunds: 'Reembolsos Pendientes', onWaitlist: 'en Lista de Espera', kpis: 'KPIs (30 Días)', conversion: 'Conversión', checkIn: 'Check-in', registrations: 'Registros', grossRev: 'Ingresos Brutos', liveEvents: 'Eventos en Vivo', resolveDisputes: 'Resolver Disputas' },
      tabs: { discover: 'Descubrir', events: 'Mis Eventos', rankings: 'Clasificaciones', profile: 'Perfil', organizer: 'Organizador' },
      settings: { title: 'Ajustes', language: 'Idioma', system: 'Sistema', notifications: 'Notificaciones', appearance: 'Apariencia', deleteAccount: 'Eliminar cuenta', signOut: 'Cerrar sesión', cancelBtn: 'Cancelar', selectLanguage: 'Seleccionar idioma' },
      account: { title: 'Cuenta', email: 'Correo electrónico', editProfile: 'Editar perfil' },
      discover: { title: 'Descubrir', searchPlaceholder: 'Buscar eventos, ligas o juegos...', seeAll: 'Ver todo', featuredEvents: 'Eventos Destacados', onlineTournaments: 'Torneos en línea', upcomingLeagues: 'Ligas Próximas', localUpcoming: 'Eventos Locales', createEvent: 'Crear evento' },
      tags: { featured: 'Destacado', online: 'En línea', league: 'Liga', upcoming: 'Próximo' },
      myEvents: { title: 'Mis Eventos', emptyTitle: 'Tus Eventos', emptyDesc: 'Aún no te has registrado en ningún evento.' },
      rankings: { title: 'Mis Clasificaciones', subtitle: 'Tus 5 mejores posiciones. Visita la página del torneo para ver el historial completo.', emptyTitle: 'Sin clasificación', emptyDesc: '¡Compite en torneos para entrar en la clasificación!', placing: 'Posición' },
      tournament: { notFound: 'Torneo no encontrado', events: 'Eventos', entrants: 'Participantes', viewBracket: 'Ver bracket ›', registered: '¡Estás registrado!', registeredDesc: 'Consulta tus eventos en el bracket.', registerNow: 'Registrarse ahora', placing: 'Posición' },
      register: { title: 'Registrarse', selectEvents: 'Seleccionar eventos', completeRegistration: 'Completar registro' },
    }
  },
  ru: {
    translation: {
      organizer: { title: 'Штаб организатора', requiresAttention: 'Требует внимания', activeDisputes: 'Активные споры', pendingRefunds: 'Ожидающие возвраты', onWaitlist: 'в листе ожидания', kpis: 'KPI (30 дней)', conversion: 'Конверсия', checkIn: 'Чекин', registrations: 'Регистрации', grossRev: 'Валовый доход', liveEvents: 'Живые события', resolveDisputes: 'Разрешить споры' },
      tabs: { discover: 'Обзор', events: 'Мои события', rankings: 'Рейтинги', profile: 'Профиль', organizer: 'Организатор' },
      settings: { title: 'Настройки', language: 'Язык', system: 'Система', notifications: 'Уведомления', appearance: 'Оформление', deleteAccount: 'Удалить аккаунт', signOut: 'Выйти', cancelBtn: 'Отмена', selectLanguage: 'Выбрать язык' },
      account: { title: 'Аккаунт', email: 'Эл. почта', editProfile: 'Редактировать профиль' },
      discover: { title: 'Обзор', searchPlaceholder: 'Найти события, лиги или игры...', seeAll: 'Смотреть все', featuredEvents: 'Избранные события', onlineTournaments: 'Онлайн-турниры', upcomingLeagues: 'Предстоящие лиги', localUpcoming: 'Местные события', createEvent: 'Создать событие' },
      tags: { featured: 'Избранное', online: 'Онлайн', league: 'Лига', upcoming: 'Скоро' },
      myEvents: { title: 'Мои события', emptyTitle: 'Ваши события', emptyDesc: 'Вы ещё не зарегистрировались ни на одно событие.' },
      rankings: { title: 'Мои рейтинги', subtitle: 'Ваши топ-5 результатов. Просмотрите страницу турнира для полной истории.', emptyTitle: 'Рейтингов пока нет', emptyDesc: 'Участвуйте в турнирах, чтобы попасть в рейтинг!', placing: 'Место' },
      tournament: { notFound: 'Турнир не найден', events: 'События', entrants: 'Участников', viewBracket: 'Сетка ›', registered: 'Вы зарегистрированы!', registeredDesc: 'Проверьте свои события в сетке.', registerNow: 'Зарегистрироваться', placing: 'Место' },
      register: { title: 'Регистрация', selectEvents: 'Выбрать события', completeRegistration: 'Завершить регистрацию' },
    }
  },
  fr: {
    translation: {
      organizer: { title: 'QG Organisateur', requiresAttention: 'Nécessite votre attention', activeDisputes: 'Litiges Actifs', pendingRefunds: 'Remboursements en attente', onWaitlist: 'sur Liste d\'attente', kpis: 'KPI (30 Jours)', conversion: 'Conversion', checkIn: 'Check-in', registrations: 'Inscriptions', grossRev: 'Revenu Brut', liveEvents: 'Événements en direct', resolveDisputes: 'Résoudre les Litiges' },
      tabs: { discover: 'Découvrir', events: 'Mes Événements', rankings: 'Classements', profile: 'Profil', organizer: 'Organisateur' },
      settings: { title: 'Paramètres', language: 'Langue', system: 'Système', notifications: 'Notifications', appearance: 'Apparence', deleteAccount: 'Supprimer le compte', signOut: 'Se déconnecter', cancelBtn: 'Annuler', selectLanguage: 'Choisir la langue' },
      account: { title: 'Compte', email: 'E-mail', editProfile: 'Modifier le profil' },
      discover: { title: 'Découvrir', searchPlaceholder: 'Trouver des événements, ligues ou jeux...', seeAll: 'Tout voir', featuredEvents: 'Événements à la une', onlineTournaments: 'Tournois en ligne', upcomingLeagues: 'Ligues à venir', localUpcoming: 'Événements locaux', createEvent: 'Créer un événement' },
      tags: { featured: 'À la une', online: 'En ligne', league: 'Ligue', upcoming: 'À venir' },
      myEvents: { title: 'Mes Événements', emptyTitle: 'Vos événements', emptyDesc: "Vous ne vous êtes inscrit à aucun événement pour l'instant." },
      rankings: { title: 'Mes classements', subtitle: "Vos 5 meilleures performances. Consultez la page du tournoi pour l'historique complet.", emptyTitle: 'Pas encore de classement', emptyDesc: 'Participez à des tournois pour figurer au classement !', placing: 'Position' },
      tournament: { notFound: 'Tournoi introuvable', events: 'Événements', entrants: 'Participants', viewBracket: 'Voir le tableau ›', registered: 'Vous êtes inscrit !', registeredDesc: 'Consultez vos événements dans le tableau.', registerNow: "S'inscrire", placing: 'Position' },
      register: { title: "S'inscrire", selectEvents: 'Sélectionner les événements', completeRegistration: "Finaliser l'inscription" },
    }
  },
  ko: {
    translation: {
      organizer: { title: '주최자 본부', requiresAttention: '주의 필요', activeDisputes: '진행 중인 분쟁', pendingRefunds: '대기 중인 환불', onWaitlist: '대기 명단', kpis: 'KPI (30일)', conversion: '전환율', checkIn: '체크인', registrations: '등록', grossRev: '총 수익', liveEvents: '라이브 이벤트', resolveDisputes: '분쟁 해결' },
      tabs: { discover: '발견', events: '내 이벤트', rankings: '순위', profile: '프로필', organizer: '주최자' },
      settings: { title: '설정', language: '언어', system: '시스템', notifications: '알림', appearance: '외관', deleteAccount: '계정 삭제', signOut: '로그아웃', cancelBtn: '취소', selectLanguage: '언어 선택' },
      account: { title: '계정', email: '이메일', editProfile: '프로필 수정' },
      discover: { title: '발견', searchPlaceholder: '이벤트, 리그, 게임 검색...', seeAll: '전체 보기', featuredEvents: '추천 이벤트', onlineTournaments: '온라인 토너먼트', upcomingLeagues: '다가오는 리그', localUpcoming: '지역 이벤트', createEvent: '이벤트 만들기' },
      tags: { featured: '추천', online: '온라인', league: '리그', upcoming: '예정' },
      myEvents: { title: '내 이벤트', emptyTitle: '내 이벤트', emptyDesc: '아직 등록한 이벤트가 없습니다.' },
      rankings: { title: '내 순위', subtitle: '상위 5개 성적입니다. 전체 기록은 토너먼트 페이지를 참고하세요.', emptyTitle: '순위 없음', emptyDesc: '토너먼트에 참가하여 리더보드에 올라보세요!', placing: '순위' },
      tournament: { notFound: '토너먼트를 찾을 수 없습니다', events: '이벤트', entrants: '참가자', viewBracket: '브래킷 보기 ›', registered: '등록되었습니다!', registeredDesc: '브래킷에서 이벤트를 확인하세요.', registerNow: '지금 등록', placing: '순위' },
      register: { title: '등록', selectEvents: '이벤트 선택', completeRegistration: '등록 완료' },
    }
  },
  ja: {
    translation: {
      organizer: { title: '主催者本部', requiresAttention: '要確認', activeDisputes: '対応中の紛争', pendingRefunds: '保留中の返金', onWaitlist: 'キャンセル待ち', kpis: 'KPI（30日間）', conversion: 'コンバージョン', checkIn: 'チェックイン', registrations: '登録', grossRev: '総収益', liveEvents: 'ライブイベント', resolveDisputes: '紛争を解決する' },
      tabs: { discover: '見つける', events: 'マイイベント', rankings: 'ランキング', profile: 'プロフィール', organizer: '主催者' },
      settings: { title: '設定', language: '言語', system: 'システム', notifications: '通知', appearance: '外観', deleteAccount: 'アカウント削除', signOut: 'ログアウト', cancelBtn: 'キャンセル', selectLanguage: '言語を選択' },
      account: { title: 'アカウント', email: 'メール', editProfile: 'プロフィール編集' },
      discover: { title: '見つける', searchPlaceholder: 'イベント、リーグ、ゲームを検索...', seeAll: 'すべて見る', featuredEvents: 'おすすめイベント', onlineTournaments: 'オンライントーナメント', upcomingLeagues: '近日開催リーグ', localUpcoming: 'ローカルイベント', createEvent: 'イベント作成' },
      tags: { featured: 'おすすめ', online: 'オンライン', league: 'リーグ', upcoming: '近日公開' },
      myEvents: { title: 'マイイベント', emptyTitle: 'あなたのイベント', emptyDesc: 'まだイベントに登録していません。' },
      rankings: { title: 'マイランキング', subtitle: 'トップ5の成績です。全履歴はトーナメントページをご覧ください。', emptyTitle: 'まだランキングなし', emptyDesc: 'トーナメントに参加してランクに入ろう！', placing: '順位' },
      tournament: { notFound: 'トーナメントが見つかりません', events: 'イベント', entrants: '参加者', viewBracket: 'ブラケット表示 ›', registered: '登録完了！', registeredDesc: 'ブラケットでイベントを確認してください。', registerNow: '今すぐ登録', placing: '順位' },
      register: { title: '登録', selectEvents: 'イベントを選択', completeRegistration: '登録を完了する' },
    }
  },
  it: {
    translation: {
      organizer: { title: 'QG Organizzatore', requiresAttention: 'Richiede Attenzione', activeDisputes: 'Controversie Attive', pendingRefunds: 'Rimborsi in Sospeso', onWaitlist: 'in Lista d\'Attesa', kpis: 'KPI (30 Giorni)', conversion: 'Conversione', checkIn: 'Check-in', registrations: 'Registrazioni', grossRev: 'Ricavo Lordo', liveEvents: 'Eventi dal Vivo', resolveDisputes: 'Risolvi Controversie' },
      tabs: { discover: 'Scopri', events: 'I Miei Eventi', rankings: 'Classifiche', profile: 'Profilo', organizer: 'Organizzatore' },
      settings: { title: 'Impostazioni', language: 'Lingua', system: 'Sistema', notifications: 'Notifiche', appearance: 'Aspetto', deleteAccount: 'Elimina account', signOut: 'Disconnetti', cancelBtn: 'Annulla', selectLanguage: 'Seleziona lingua' },
      account: { title: 'Account', email: 'Email', editProfile: 'Modifica profilo' },
      discover: { title: 'Scopri', searchPlaceholder: 'Cerca eventi, leghe o giochi...', seeAll: 'Vedi tutto', featuredEvents: 'Eventi in evidenza', onlineTournaments: 'Tornei online', upcomingLeagues: 'Leghe in arrivo', localUpcoming: 'Eventi locali', createEvent: 'Crea evento' },
      tags: { featured: 'In evidenza', online: 'Online', league: 'Lega', upcoming: 'In arrivo' },
      myEvents: { title: 'I Miei Eventi', emptyTitle: 'I tuoi eventi', emptyDesc: 'Non ti sei ancora iscritto a nessun evento.' },
      rankings: { title: 'Le mie classifiche', subtitle: 'Le tue top 5 posizioni. Visita la pagina del torneo per la cronologia completa.', emptyTitle: 'Nessuna classifica', emptyDesc: 'Partecipa ai tornei per entrare in classifica!', placing: 'Posizione' },
      tournament: { notFound: 'Torneo non trovato', events: 'Eventi', entrants: 'Partecipanti', viewBracket: 'Vedi bracket ›', registered: 'Sei registrato!', registeredDesc: 'Controlla i tuoi eventi nel bracket.', registerNow: 'Iscriviti ora', placing: 'Posizione' },
      register: { title: 'Iscrizione', selectEvents: 'Seleziona eventi', completeRegistration: "Completa l'iscrizione" },
    }
  },
  'pt-PT': {
    translation: {
      organizer: { title: 'Sede do Organizador', requiresAttention: 'Requer Atenção', activeDisputes: 'Disputas Ativas', pendingRefunds: 'Reembolsos Pendentes', onWaitlist: 'em Lista de Espera', kpis: 'KPIs (30 Dias)', conversion: 'Conversão', checkIn: 'Check-in', registrations: 'Inscrições', grossRev: 'Receita Bruta', liveEvents: 'Eventos ao Vivo', resolveDisputes: 'Resolver Disputas' },
      tabs: { discover: 'Descobrir', events: 'Os Meus Eventos', rankings: 'Classificações', profile: 'Perfil', organizer: 'Organizador' },
      settings: { title: 'Definições', language: 'Idioma', system: 'Sistema', notifications: 'Notificações', appearance: 'Aparência', deleteAccount: 'Eliminar conta', signOut: 'Terminar sessão', cancelBtn: 'Cancelar', selectLanguage: 'Selecionar idioma' },
      account: { title: 'Conta', email: 'E-mail', editProfile: 'Editar perfil' },
      discover: { title: 'Descobrir', searchPlaceholder: 'Encontrar eventos, ligas ou jogos...', seeAll: 'Ver tudo', featuredEvents: 'Eventos em Destaque', onlineTournaments: 'Torneios Online', upcomingLeagues: 'Ligas a Vir', localUpcoming: 'Eventos Locais', createEvent: 'Criar evento' },
      tags: { featured: 'Destaque', online: 'Online', league: 'Liga', upcoming: 'Em breve' },
      myEvents: { title: 'Os Meus Eventos', emptyTitle: 'Os seus eventos', emptyDesc: 'Ainda não se inscreveu em nenhum evento.' },
      rankings: { title: 'As minhas classificações', subtitle: 'As suas top 5 posições. Veja a página do torneio para o historial completo.', emptyTitle: 'Sem classificações', emptyDesc: 'Participe em torneios para entrar nas classificações!', placing: 'Posição' },
      tournament: { notFound: 'Torneio não encontrado', events: 'Eventos', entrants: 'Participantes', viewBracket: 'Ver bracket ›', registered: 'Está inscrito!', registeredDesc: 'Veja os seus eventos no bracket.', registerNow: 'Inscrever-me', placing: 'Posição' },
      register: { title: 'Inscrição', selectEvents: 'Selecionar eventos', completeRegistration: 'Concluir inscrição' },
    }
  },
  'pt-BR': {
    translation: {
      organizer: { title: 'Sede do Organizador', requiresAttention: 'Requer Atenção', activeDisputes: 'Disputas Ativas', pendingRefunds: 'Reembolsos Pendentes', onWaitlist: 'em Lista de Espera', kpis: 'KPIs (30 Dias)', conversion: 'Conversão', checkIn: 'Check-in', registrations: 'Inscrições', grossRev: 'Receita Bruta', liveEvents: 'Eventos ao Vivo', resolveDisputes: 'Resolver Disputas' },
      tabs: { discover: 'Descobrir', events: 'Meus Eventos', rankings: 'Classificações', profile: 'Perfil', organizer: 'Organizador' },
      settings: { title: 'Configurações', language: 'Idioma', system: 'Sistema', notifications: 'Notificações', appearance: 'Aparência', deleteAccount: 'Excluir conta', signOut: 'Sair', cancelBtn: 'Cancelar', selectLanguage: 'Selecionar idioma' },
      account: { title: 'Conta', email: 'E-mail', editProfile: 'Editar perfil' },
      discover: { title: 'Descobrir', searchPlaceholder: 'Encontrar eventos, ligas ou jogos...', seeAll: 'Ver tudo', featuredEvents: 'Eventos em Destaque', onlineTournaments: 'Torneios Online', upcomingLeagues: 'Ligas Próximas', localUpcoming: 'Eventos Locais', createEvent: 'Criar evento' },
      tags: { featured: 'Destaque', online: 'Online', league: 'Liga', upcoming: 'Em breve' },
      myEvents: { title: 'Meus Eventos', emptyTitle: 'Seus eventos', emptyDesc: 'Você ainda não se inscreveu em nenhum evento.' },
      rankings: { title: 'Minhas classificações', subtitle: 'Seu top 5 de posições. Veja a página do torneio para o histórico completo.', emptyTitle: 'Sem classificações ainda', emptyDesc: 'Participe de torneios para entrar nas classificações!', placing: 'Posição' },
      tournament: { notFound: 'Torneio não encontrado', events: 'Eventos', entrants: 'Participantes', viewBracket: 'Ver bracket ›', registered: 'Você está inscrito!', registeredDesc: 'Confira seus eventos no bracket.', registerNow: 'Inscrever-se agora', placing: 'Posição' },
      register: { title: 'Inscrição', selectEvents: 'Selecionar eventos', completeRegistration: 'Concluir inscrição' },
    }
  },
};

// Auto-detect user's locale (e.g. 'en-US' -> 'en')
const systemLocales = Localization.getLocales();
const localeCode = systemLocales[0]?.languageCode ?? 'en';
const regionCode = systemLocales[0]?.regionCode;
const fullLocale = `${localeCode}-${regionCode}`;

// Prioritize full locale for pt-BR and pt-PT, fallback to language code, then English
const defaultLocale = resources[fullLocale as keyof typeof resources]
  ? fullLocale
  : (resources[localeCode as keyof typeof resources] ? localeCode : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLocale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
