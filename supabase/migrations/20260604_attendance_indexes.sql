-- Add indexes for scalable attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (date);
CREATE INDEX IF NOT EXISTS idx_attendance_client_date ON public.attendance (client_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_month ON public.attendance (date_trunc('month', date));
