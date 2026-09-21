import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { MyAccountInvite } from '@kortix/sdk';

import {
  chooserMode,
  joinDestination,
  ProjectChooserView,
  type ProjectChooserViewProps,
} from './project-chooser';

function invite(overrides: Partial<MyAccountInvite> = {}): MyAccountInvite {
  return {
    invite_id: 'inv-1',
    account_id: 'acc-1',
    account_name: 'Mirkos Org',
    initial_role: 'member',
    inviter_email: 'marko@kortix.ai',
    created_at: '2026-09-21T00:00:00.000Z',
    expires_at: '2026-10-05T00:00:00.000Z',
    projects: [],
    ...overrides,
  };
}

describe('chooserMode', () => {
  test('any pending invite puts the invites first, whatever the create permission', () => {
    expect(chooserMode({ inviteCount: 1, canCreate: true })).toBe('invites');
    expect(chooserMode({ inviteCount: 2, canCreate: false })).toBe('invites');
  });

  test('no invites and create permission is the empty state with one create action', () => {
    expect(chooserMode({ inviteCount: 0, canCreate: true })).toBe('empty');
  });

  test('no invites and no create permission tells the user to ask for an invite', () => {
    expect(chooserMode({ inviteCount: 0, canCreate: false })).toBe('no-permission');
  });
});

describe('joinDestination', () => {
  test('a project invite opens the first invited project', () => {
    const inv = invite({
      projects: [
        { project_id: 'p-1', name: 'Mirko Boss 900', role: 'member' },
        { project_id: 'p-2', name: 'Other', role: 'member' },
      ],
    });
    expect(joinDestination(inv)).toBe('/projects/p-1');
  });

  test('a plain workspace invite has no project to open, so the door resolves one', () => {
    expect(joinDestination(invite())).toBeNull();
  });
});

function render(props: Partial<ProjectChooserViewProps>) {
  return renderToStaticMarkup(
    createElement(ProjectChooserView, {
      email: 'test21221x@yopmail.com',
      invites: [],
      invitesLoading: false,
      canCreate: true,
      joiningInviteId: null,
      onJoin: () => {},
      ...props,
    }),
  );
}

describe('ProjectChooserView', () => {
  test('the empty state offers exactly one create action and names the email invites go to', () => {
    const html = render({});
    expect(html).toContain('Create your first project');
    expect(html).toContain('href="/new"');
    expect(html).toContain('test21221x@yopmail.com');
    expect(html).not.toContain('Join');
  });

  test('a project invite names the project, the workspace and the inviter, with a Join action', () => {
    const html = render({
      invites: [invite({ projects: [{ project_id: 'p-1', name: 'Mirko Boss 900', role: 'member' }] })],
    });
    expect(html).toContain('Invitations');
    expect(html).toContain('Mirko Boss 900');
    expect(html).toContain('Mirkos Org');
    expect(html).toContain('marko@kortix.ai');
    expect(html).toContain('Join');
    // With invites to act on, creating is the secondary path, not the headline.
    expect(html).not.toContain('Create your first project');
    expect(html).toContain('href="/new"');
  });

  test('a member with no invites and no create permission gets no create control', () => {
    const html = render({ canCreate: false });
    expect(html).toContain('No workspace yet');
    expect(html).not.toContain('href="/new"');
  });

  test('the row being joined disables every Join button', () => {
    const html = render({
      invites: [invite(), invite({ invite_id: 'inv-2', account_name: 'Second Org' })],
      joiningInviteId: 'inv-1',
    });
    expect(html.match(/<button[^>]*disabled/g)?.length).toBe(2);
  });

  test('the chooser never links back to /projects, which redirects here', () => {
    for (const props of [{}, { canCreate: false }, { invites: [invite()] }]) {
      expect(render(props)).not.toContain('href="/projects"');
    }
  });
});
