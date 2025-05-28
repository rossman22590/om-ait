import EditPersonalAccountName from '@/components/basejump/edit-personal-account-name';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CustomPromptWrapper from './custom-prompt-wrapper';

export default async function PersonalAccountSettingsPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc(
    'get_personal_account',
  );

  return (
    <div className="space-y-8">
      <EditPersonalAccountName account={personalAccount} />
      
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
          <CardDescription>
            Customize how the AI assistant behaves when responding to your requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomPromptWrapper />
        </CardContent>
      </Card>
    </div>
  );
}
