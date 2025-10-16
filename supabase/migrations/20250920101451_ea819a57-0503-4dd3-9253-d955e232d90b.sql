-- Drop the overly permissive policy that allows all users to view board members
DROP POLICY IF EXISTS "Users can view active board members" ON public.board_members;

-- Create a more restrictive policy that only allows admins and presidents to view board member details
CREATE POLICY "Only admins and presidents can view board members" 
ON public.board_members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'president'::app_role)
);