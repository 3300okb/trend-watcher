// Supabase 設定
// ※ anon key はフロントエンド公開用のキーです。RLS によりユーザーは自身のデータのみ操作できます。
// app.js が ES モジュールのため window オブジェクト経由で公開します。
window.SUPABASE_CONFIG = {
  url: 'https://kiaqxehlkhrdcwfxradi.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpYXF4ZWhsa2hyZGN3ZnhyYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjUxOTYsImV4cCI6MjA4Nzk0MTE5Nn0.hYDyUZ82rG13fu3K0P88V9vB03EXK6Lo7yL4klp53qM',
};
