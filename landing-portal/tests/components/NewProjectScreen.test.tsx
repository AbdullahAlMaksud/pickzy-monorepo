import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NewProjectScreen } from '@/features/projects/components/NewProjectScreen';
import { renderApp } from '../helpers/renderApp';
import { router } from '../helpers/router';

describe('NewProjectScreen', () => {
  it('creates a project with the typed participants and opens it', async () => {
    const { app } = await renderApp(<NewProjectScreen />);

    fireEvent.change(screen.getByTestId('project-name-input'), { target: { value: 'Friday raffle' } });
    fireEvent.change(screen.getByTestId('add-names-input'), { target: { value: 'Ayesha\nBilal\nChitra' } });
    fireEvent.click(screen.getByTestId('add-names-button'));
    expect(await screen.findByTestId('add-names-message')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('create-project'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));

    const [project] = await app.services.projects.listProjects({});
    expect(project).toMatchObject({ name: 'Friday raffle', participantCount: 3 });
    expect(router.replace).toHaveBeenCalledWith(`/projects/${project.id}`);
  });

  it('shows validation messages and saves nothing when the form is empty', async () => {
    const { app } = await renderApp(<NewProjectScreen />);
    fireEvent.click(screen.getByTestId('create-project'));

    expect((await screen.findAllByRole('alert')).length).toBeGreaterThanOrEqual(2);
    expect(router.replace).not.toHaveBeenCalled();
    expect(await app.services.projects.listProjects({})).toHaveLength(0);
  });

  it('reports skipped duplicates instead of dropping them silently', async () => {
    await renderApp(<NewProjectScreen />);
    fireEvent.change(screen.getByTestId('add-names-input'), { target: { value: 'Ayesha\nayesha' } });
    fireEvent.click(screen.getByTestId('add-names-button'));
    // default policy is "keep": both are added, and the message still says so
    expect(await screen.findByTestId('add-names-message')).toHaveTextContent(/2/);
  });
});
