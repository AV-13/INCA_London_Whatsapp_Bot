# TODO

- Il faut que l'utilisateur sache qu'il y a 4 menus et pas juste le menu à la carte.
J'aimerais utiliser les boutons interactifs de whatsApp Business pour gérer différentes réponses : 
  - Donner la possibilité d'afficher 4 menus dans 4 boutons différents. Si on clique dessus, on affiche le menu en question (le PDF directement)
  - J'aimerais que l'utilisateur puisse récupérer tous les menus d'un coup si il le demande => on envoie les 4 pdf d'un coup.
- J'aimerais enlever l'affichage markdown qui est géré pour certaines réponses : mots en gras qui s'affichent dans le message whatsapp par *motengras* au lieu de motengras.
- J'aimerais éviter tout lien complet vers les images PDF dans le texte, si ce n'est pas déjà complétement géré. Lorsque l'on envoie le pdf d'un menu, on envoie le document PDF directement et on ne passe jamais par un lien.

  - Parfait pour la gestion des menus, il faut aussi que ce soit traduit dans la langue de l'utilisateur (laisser faire mastra)
  - Pour les boutons interactifs, tu mets un bouton voir tous les menus qui affichent ensuite les différents choix. J'aimerais avoir directement les différents choix via les boutons, pour éviter un clic en plus.
  Idée pour les réservations: pas possible de mettre l'iFrame de réservation directement dans WhatsApp.
  On peut par contre :
- Faire un parcours avec des boutons interactifs :
  - Bouton 1 : Nombre de personnes.
  - Bouton 2 : Date et heure.
  - Bouton 3 : Durée du repas (1h30, 2h, 2h30)
  - Bouton 3 : envoyez le lien avec les query params associés.
    https://www.sevenrooms.com/explore/incalondon/reservations/create/search?date=2025-10-17&halo=120&party_size=6&start_time=07%3A30
  - date : YYYY-MM-DD
  - halo : durée en minutes
  - party_size : nombre de personnes
  - start_time : heure de début au format HH:MM (24h)
  
  - J'aimerais finalement garder un bouton intermédiaire "voir les menus qui affiche ensuite les boutons interactifs pour chaque menu.
  - Lister les mots en durs pour assurer la réservation n'est pas scalable ni multi-lingue. Il faut utiliser Mastra pour obtenir la langue et faire la traduction du message de l'utilisateur (étape intermédiaire). Ensuite on traite la version traduite (ou l'intention détectée) dans le code. => Plus besoin de gérer les mots clés dans toutes les langues.
  - Il faut intégrer une base de données supabase pour garder en mémoire les derniers messages, et permettre à mastra de savoir si il s'adresse à un ancien ou un nouvel utilisateur.
    - Project URL: https://xkqjvytqgdzgmxmfgbwb.supabase.co // 
    - API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoYnlmYWFqZHhycWx6endvZ2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTc4NjksImV4cCI6MjA3NjA5Mzg2OX0.0TE5tD1HodgB5VnsVdbri0GnopNtNMO5y7gjY-RuWow
      - dans le .env tu as toutes les informations pour faire correctement la connexion à la base de données:
        SUPABASE_URL=
        SUPABASE_API_KEY=
        SUPABASE_PROJECT_ID=
        SUPABASE_DB_PORT=
        SUPABASE_DB_HOST=
        SUPABASE_DB_USER=
        SUPABASE_DB_PASSWORD=
        SUPABASE_SERVICE_ROLE_KEY=
      postgresql://SUPABASE_DB_USER:SUPABASE_DB_PASSWORD@SUPABASE_DB_HOST:SUPABASE_DB_PORT/postgres
      J'ai déjà tout configurer et effectuer mes migrations. Il faut maintenant l'intégrer dans le code.
      - Voici le schéma des deux tables :
        -- WARNING: This schema is for context only and is not meant to be run.
        -- Table order and constraints may not be valid for execution.

    CREATE TABLE public.conversations (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        user_phone text NOT NULL,
        status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'closed'::text])),
        started_at timestamp with time zone NOT NULL DEFAULT now(),
        last_message_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT conversations_pkey PRIMARY KEY (id)
    );
    CREATE TABLE public.messages (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL,
        wa_message_id text,
        direction text NOT NULL CHECK (direction = ANY (ARRAY['in'::text, 'out'::text])),
        sender text NOT NULL CHECK (sender = ANY (ARRAY['user'::text, 'bot'::text])),
        message_type text NOT NULL DEFAULT 'text'::text,
        text_content text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        delivered_at timestamp with time zone,
        read_at timestamp with time zone,
        CONSTRAINT messages_pkey PRIMARY KEY (id),
        CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
    );
      On identifie l'utilisateur via son numéro de téléphone.
      On permet à mastra de savoir si c'est un nouvel utilisateur ou un ancien.
      On permet à mastra de consulter l'historique des messages avant de répondre.
      On permet aussi de savoir si c'est une nouvelle conversation ou une conversation en cours.
  J'aimerais que mastra prenne des initiatives pour guider l'utilisateur dans la conversation : exemple de conversation => demande de menu => l'utilisateur fait son choix => le bot lui envoie le menu puis demande ensuite si l'utilisateur veut réserver ?
  - Il ne faut jamais envoyer des messages dans une langue fixe, y compris pour les messages accompagnant les menus : "Voici le menu à la carte"
  - Il est important de TOUJOURS répondre dans la langue de l'utilisateur, pour le nom des menus INCLUS : "Voici le menu à la carte" => "Here is the à la carte menu" pour un utilisateur anglais, etc. On doit pouvoir gérer toutes les langues grâce à mastra.
  - Il faut aussi documenter au maximum le code (jsdoc) et faire un README complet et détaillé.

context seven pour les docs des outils.