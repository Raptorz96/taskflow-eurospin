-- TaskFlow Eurospin Database Schema

-- Enable RLS
alter database postgres set timezone to 'Europe/Rome';

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  ruolo text not null check (ruolo in ('responsabile', 'vice', 'admin', 'dipendente')),
  reparto text check (reparto in ('ortofrutta', 'macelleria', 'gastronomia', 'panetteria', 'magazzino', 'casse')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  titolo text not null,
  descrizione text,
  priorita integer not null check (priorita >= 1 and priorita <= 5),
  tempo_stimato integer, -- in minutes
  reparto text not null check (reparto in ('ortofrutta', 'macelleria', 'gastronomia', 'panetteria', 'magazzino', 'casse')),
  fascia_oraria text not null check (fascia_oraria in ('mattina', 'pomeriggio', 'sera')),
  data_scadenza timestamp with time zone,
  stato text not null default 'da_fare' check (stato in ('da_fare', 'in_corso', 'completato')),
  assegnato_a uuid references profiles(id),
  creato_da uuid references profiles(id) not null,
  completato_da uuid references profiles(id),
  completato_il timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recurring_tasks table
create table if not exists recurring_tasks (
  id uuid default gen_random_uuid() primary key,
  titolo_template text not null,
  descrizione_template text,
  priorita integer not null check (priorita >= 1 and priorita <= 5),
  tempo_stimato integer, -- in minutes
  reparto text not null check (reparto in ('ortofrutta', 'macelleria', 'gastronomia', 'panetteria', 'magazzino', 'casse')),
  fascia_oraria text not null check (fascia_oraria in ('mattina', 'pomeriggio', 'sera')),
  frequenza text not null check (frequenza in ('daily', 'weekly', 'monthly')),
  giorni_settimana integer[] default null, -- 0=Sunday, 1=Monday, etc.
  giorno_mese integer default null, -- day of month for monthly
  attivo boolean default true,
  creato_da uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  testo text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product_alerts table
create table if not exists product_alerts (
  id uuid default gen_random_uuid() primary key,
  nome_prodotto text not null,
  data_scadenza date not null,
  reparto text not null check (reparto in ('ortofrutta', 'macelleria', 'gastronomia', 'panetteria', 'magazzino', 'casse')),
  giorni_preavviso integer default 3,
  task_generato uuid references tasks(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table recurring_tasks enable row level security;
alter table comments enable row level security;
alter table product_alerts enable row level security;

-- Policies for profiles
create policy "Users can view all profiles" on profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Policies for tasks
create policy "Users can view all tasks" on tasks
  for select using (auth.role() = 'authenticated');

create policy "Users can insert tasks" on tasks
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update tasks" on tasks
  for update using (auth.role() = 'authenticated');

create policy "Users can delete own tasks" on tasks
  for delete using (auth.uid() = creato_da);

-- Policies for recurring_tasks
create policy "Users can view recurring tasks" on recurring_tasks
  for select using (auth.role() = 'authenticated');

create policy "Managers can manage recurring tasks" on recurring_tasks
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and ruolo in ('responsabile', 'admin')
    )
  );

-- Policies for comments
create policy "Users can view comments" on comments
  for select using (auth.role() = 'authenticated');

create policy "Users can insert comments" on comments
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update own comments" on comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments" on comments
  for delete using (auth.uid() = user_id);

-- Policies for product_alerts
create policy "Users can view product alerts" on product_alerts
  for select using (auth.role() = 'authenticated');

create policy "Users can insert product alerts" on product_alerts
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update product alerts" on product_alerts
  for update using (auth.role() = 'authenticated');

-- Functions and triggers

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_tasks_updated_at
  before update on tasks
  for each row execute procedure update_updated_at_column();

create trigger update_recurring_tasks_updated_at
  before update on recurring_tasks
  for each row execute procedure update_updated_at_column();

-- Function to handle task completion
create or replace function handle_task_completion()
returns trigger as $$
begin
  if new.stato = 'completato' and old.stato != 'completato' then
    new.completato_da = auth.uid();
    new.completato_il = timezone('utc'::text, now());
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for task completion
create trigger task_completion_trigger
  before update on tasks
  for each row execute procedure handle_task_completion();

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, ruolo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce(new.raw_user_meta_data->>'ruolo', 'dipendente')
  );
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create orders configuration table
create table if not exists ordini_config (
  id uuid default gen_random_uuid() primary key,
  tipo_ordine text not null check (tipo_ordine in ('sala', 'surgelati', 'pesce')),
  giorno_ordine integer, -- 0=dom, 1=lun...
  giorno_consegna integer,
  orario_limite time,
  orario_promemoria time,
  attivo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders log table
create table if not exists ordini_log (
  id uuid default gen_random_uuid() primary key,
  tipo_ordine text not null,
  data_ordine date not null,
  stato text default 'da_fare' check (stato in ('da_fare', 'in_corso', 'completato', 'saltato')),
  ora_inizio timestamp with time zone,
  ora_completamento timestamp with time zone,
  completato_da uuid references profiles(id),
  note text,
  ripasso_fatto boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Config giorni camion
create table if not exists camion_config (
  id uuid default gen_random_uuid() primary key,
  giorno_settimana integer not null unique check (giorno_settimana >= 0 and giorno_settimana <= 6), -- 1=lun, 3=mer, 5=ven
  orario_arrivo time default '21:00',
  attivo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on order tables
alter table ordini_config enable row level security;
alter table ordini_log enable row level security;
alter table camion_config enable row level security;
alter table scadenze_sala enable row level security;

-- Modifica tabelle per aggiungere supporto condizione camion
alter table tasks add column if not exists condizione_camion text check (condizione_camion in ('con_camion', 'senza_camion', 'sempre'));
alter table tasks add column if not exists orario_suggerito time;
alter table recurring_tasks add column if not exists condizione_camion text check (condizione_camion in ('con_camion', 'senza_camion', 'sempre'));
alter table recurring_tasks add column if not exists orario_suggerito time;

-- Policies for ordini_config
create policy "Users can view orders config" on ordini_config
  for select using (auth.role() = 'authenticated');

create policy "Managers can manage orders config" on ordini_config
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and ruolo in ('responsabile', 'admin')
    )
  );

-- Policies for ordini_log
create policy "Users can view orders log" on ordini_log
  for select using (auth.role() = 'authenticated');

create policy "Users can insert orders log" on ordini_log
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update orders log" on ordini_log
  for update using (auth.role() = 'authenticated');

-- Policies for camion_config
create policy "Users can view camion config" on camion_config
  for select using (auth.role() = 'authenticated');

create policy "Managers can manage camion config" on camion_config
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and ruolo in ('responsabile', 'admin')
    )
  );

-- Policies for scadenze_sala
create policy "Users can view expiration dates" on scadenze_sala
  for select using (auth.role() = 'authenticated');

create policy "Users can insert expiration dates" on scadenze_sala
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update expiration dates" on scadenze_sala
  for update using (auth.role() = 'authenticated');

-- Insert default order configuration
INSERT INTO ordini_config (tipo_ordine, giorno_ordine, giorno_consegna, orario_limite, orario_promemoria) VALUES
('sala', 5, 1, '20:00', '14:30'), -- venerdì per lunedì
('sala', 2, 3, '13:00', '07:00'), -- martedì per mercoledì  
('sala', 4, 5, '13:00', '07:00'), -- giovedì per venerdì
('surgelati', null, null, '20:00', '16:00'), -- tutti giorni tranne sabato
('pesce', 1, 1, '07:30', '07:00'), -- lunedì
('pesce', 3, 3, '07:30', '07:00'), -- mercoledì
('pesce', 5, 5, '07:30', '07:00'); -- venerdì

-- Insert default camion configuration
INSERT INTO camion_config (giorno_settimana) VALUES (1), (3), (5);

-- Prodotti con scadenze
create table if not exists scadenze_sala (
  id uuid default gen_random_uuid() primary key,
  nome_prodotto text not null,
  codice_ean text,
  lotto text,
  data_scadenza date not null,
  quantita integer default 1,
  reparto text check (reparto in ('ortofrutta', 'macelleria', 'gastronomia', 'panetteria', 'magazzino', 'casse')),
  ubicazione text, -- es: "Corsia 3, Scaffale B"
  rimosso boolean default false,
  rimosso_da uuid references profiles(id),
  rimosso_il timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vista per scadenze imminenti
create or replace view scadenze_urgenti as
select *, 
  case 
    when data_scadenza < current_date then 'scaduto'
    when data_scadenza = current_date then 'oggi'
    when data_scadenza <= current_date + 3 then 'critico'
    when data_scadenza <= current_date + 7 then 'attenzione'
    else 'ok'
  end as urgenza
from scadenze_sala
where not rimosso;

-- Create promo_config table
create table if not exists promo_config (
  id uuid default gen_random_uuid() primary key,
  nome_promo text not null,
  data_inizio date not null,
  data_fine date not null,
  corsie text[], -- array corsie interessate
  stato text default 'preparazione' check (stato in ('preparazione', 'attiva', 'completata')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on promo_config
alter table promo_config enable row level security;

-- Policies for promo_config
create policy "Users can view promo config" on promo_config
  for select using (auth.role() = 'authenticated');

create policy "Managers can manage promo config" on promo_config
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and ruolo in ('responsabile', 'admin')
    )
  );

-- Indexes for performance
create index if not exists idx_tasks_stato on tasks(stato);
create index if not exists idx_tasks_reparto on tasks(reparto);
create index if not exists idx_tasks_fascia_oraria on tasks(fascia_oraria);
create index if not exists idx_tasks_assegnato_a on tasks(assegnato_a);
create index if not exists idx_tasks_data_scadenza on tasks(data_scadenza);
create index if not exists idx_comments_task_id on comments(task_id);
create index if not exists idx_product_alerts_data_scadenza on product_alerts(data_scadenza);
create index if not exists idx_ordini_log_data_ordine on ordini_log(data_ordine);
create index if not exists idx_ordini_log_tipo_ordine on ordini_log(tipo_ordine);
create index if not exists idx_ordini_log_stato on ordini_log(stato);
create index if not exists idx_scadenze_sala_data_scadenza on scadenze_sala(data_scadenza);
create index if not exists idx_scadenze_sala_reparto on scadenze_sala(reparto);
create index if not exists idx_scadenze_sala_rimosso on scadenze_sala(rimosso);
create index if not exists idx_promo_config_data_inizio on promo_config(data_inizio);
create index if not exists idx_promo_config_data_fine on promo_config(data_fine);
create index if not exists idx_promo_config_stato on promo_config(stato);

-- Sample data (uncomment to insert)
/*
-- Insert sample profiles
insert into profiles (id, nome, ruolo, reparto) values
  ('00000000-0000-0000-0000-000000000001', 'Mario Rossi', 'responsabile', 'ortofrutta'),
  ('00000000-0000-0000-0000-000000000002', 'Giulia Bianchi', 'vice', 'macelleria'),
  ('00000000-0000-0000-0000-000000000003', 'Luca Verdi', 'dipendente', 'magazzino');

-- Insert sample tasks
insert into tasks (titolo, descrizione, priorita, tempo_stimato, reparto, fascia_oraria, creato_da) values
  ('Controllo temperatura frigo', 'Verificare che tutti i frigoriferi siano alla temperatura corretta', 5, 15, 'ortofrutta', 'mattina', '00000000-0000-0000-0000-000000000001'),
  ('Riordino scaffali', 'Sistemare i prodotti sugli scaffali secondo planogramma', 3, 120, 'magazzino', 'pomeriggio', '00000000-0000-0000-0000-000000000001');

-- Insert sample recurring tasks
insert into recurring_tasks (titolo_template, descrizione_template, priorita, tempo_stimato, reparto, fascia_oraria, frequenza, giorni_settimana, attivo, creato_da) values
  ('Pulizie mattutine', 'Pulizia generale del reparto', 4, 45, 'ortofrutta', 'mattina', 'daily', '{1,2,3,4,5,6}', true, '00000000-0000-0000-0000-000000000001'),
  ('Controllo scadenze', 'Verificare prodotti in scadenza', 5, 30, 'ortofrutta', 'mattina', 'daily', '{1,2,3,4,5,6}', true, '00000000-0000-0000-0000-000000000001');
*/