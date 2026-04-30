-- Helper function for server-side agent routines to execute arbitrary SQL
-- Only callable with service_role key (bypasses RLS)
create or replace function public.agent_execute_sql(query_text text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  execute format(
    'select coalesce(json_agg(row_to_json(t)), ''[]''::json) from (%s) t',
    query_text
  ) into result;
  return result;
exception when others then
  return jsonb_build_object('error', sqlerrm, 'query', left(query_text, 200));
end;
$$;

-- Restrict to service_role only — anon/authenticated cannot call this
revoke execute on function public.agent_execute_sql(text) from public, anon, authenticated;
grant execute on function public.agent_execute_sql(text) to service_role;
