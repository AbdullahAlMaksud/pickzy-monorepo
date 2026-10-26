import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { NewProjectScreen } from '@/features/projects/screens/NewProjectScreen';
import { renderWithApp, setupApp } from '../helpers/renderWithApp';

describe('New project screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a project from typed names, keeps duplicates, and opens it', async () => {
    const { services } = await setupApp();
    await renderWithApp(<NewProjectScreen />, services);

    await fireEvent.changeText(screen.getByTestId('project-name-input'), '  Team Lunch ');
    await fireEvent.changeText(screen.getByTestId('add-names-input'), 'Rahim\nNusrat\n\nrahim');
    await fireEvent.press(screen.getByTestId('add-names-button'));

    await waitFor(() => expect(screen.getByText('Participants (3)')).toBeTruthy());
    expect(screen.getByText(/Added 3 names/)).toBeTruthy();
    expect(screen.getByText(/1 duplicates kept/)).toBeTruthy();
    expect(screen.getByText(/1 blank lines ignored/)).toBeTruthy();
    expect(screen.getByText('Create Project (3)')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('create-project'));
    await waitFor(() => expect(router.replace).toHaveBeenCalled());

    const projects = await services.projects.listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({ name: 'Team Lunch', participantCount: 3 });
    expect(router.replace).toHaveBeenCalledWith(`/project/${projects[0].id}`);
    expect((await services.participants.list(projects[0].id)).map((p) => p.displayName)).toEqual(['Rahim', 'Nusrat', 'rahim']);
  });

  it('skips duplicates when asked and says how many were skipped', async () => {
    const { services } = await setupApp();
    await renderWithApp(<NewProjectScreen />, services);
    await fireEvent.press(screen.getByTestId('dup-policy-skip'));
    await fireEvent.changeText(screen.getByTestId('add-names-input'), 'Rahim\nrahim\nNusrat');
    await fireEvent.press(screen.getByTestId('add-names-button'));
    await waitFor(() => expect(screen.getByText('Participants (2)')).toBeTruthy());
    expect(screen.getByText(/1 duplicates skipped/)).toBeTruthy();
  });

  it('shows validation errors and does not save an invalid project', async () => {
    const { services } = await setupApp();
    await renderWithApp(<NewProjectScreen />, services);
    await fireEvent.press(screen.getByTestId('create-project'));
    await waitFor(() => expect(screen.getByText('Please enter a project name.')).toBeTruthy());
    expect(screen.getByText('Add at least one participant to continue.')).toBeTruthy();
    expect(await services.projects.listProjects()).toHaveLength(0);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('refuses blank participant input', async () => {
    const { services } = await setupApp();
    await renderWithApp(<NewProjectScreen />, services);
    await fireEvent.changeText(screen.getByTestId('add-names-input'), '   \n  ');
    await fireEvent.press(screen.getByTestId('add-names-button'));
    await waitFor(() => expect(screen.getByText('Please type a name first.')).toBeTruthy());
    expect(screen.getByText('Participants (0)')).toBeTruthy();
  });

  it('removes a participant and clears all after confirmation', async () => {
    const { services } = await setupApp();
    await renderWithApp(<NewProjectScreen />, services);
    await fireEvent.changeText(screen.getByTestId('add-names-input'), 'A\nB\nC');
    await fireEvent.press(screen.getByTestId('add-names-button'));
    await waitFor(() => expect(screen.getByText('Participants (3)')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Remove B'));
    await waitFor(() => expect(screen.getByText('Participants (2)')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('clear-all'));
    expect(screen.getByText('Clear all participants?')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Clear all').slice(-1)[0]);
    await waitFor(() => expect(screen.getByText('Participants (0)')).toBeTruthy());
  });

  it('renders in Bengali', async () => {
    const { services } = await setupApp({ locale: 'bn' });
    await renderWithApp(<NewProjectScreen />, services);
    expect(screen.getByText('নতুন প্রজেক্ট')).toBeTruthy();
    expect(screen.getByText('প্রজেক্টের নাম')).toBeTruthy();
    expect(screen.queryByText('Project Name')).toBeNull();
  });
});
