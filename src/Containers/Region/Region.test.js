import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Routes,
  Route,
  useParams,
} from 'react-router-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import CustomRender from '../../Mocks/customRenderNoRouter';
import '@testing-library/jest-dom';
import { countriesTestHandlers } from '../../Mocks/handlers';

import Region from './Region';

const server = setupServer(...countriesTestHandlers);

let testRegion;
let component;

const DummyComp = () => {
  const { country } = useParams();
  return (
    <h2>
      {country}
      {' '}
      is a country
    </h2>
  );
};

describe(Region, () => {
  // Enable API mocking before tests.
  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    testRegion = 'America';

    component = CustomRender(
      <MemoryRouter initialEntries={[`/${testRegion}`]}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
          <Route
            path="/:regionName/:country/:lat/:lon"
            element={<DummyComp />}
          />
        </Routes>
      </MemoryRouter>,
    );
  });
  // Reset any runtime request handlers we may add during the tests.
  afterEach(() => {
    server.resetHandlers();
  });

  // Disable API mocking after the tests are done.
  afterAll(() => server.close());

  test('should render the name and the image of the Region', async () => {
    let regionTitle = screen.getByRole('heading', {
      name: /America/i,
      level: 2,
    });

    let regionImage = screen.getByRole('img', {
      name: /America/i,
    });
    expect(regionTitle).toBeInTheDocument();
    expect(regionImage).toBeInTheDocument();

    component.unmount();
    testRegion = 'Africa';
    component = CustomRender(
      <MemoryRouter initialEntries={[`/${testRegion}`]}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
        </Routes>
      </MemoryRouter>,
    );

    regionTitle = screen.getByRole('heading', {
      name: /africa/i,
      level: 2,
    });

    regionImage = screen.getByRole('img', {
      name: /africa/i,
    });
    expect(regionTitle).toBeInTheDocument();
    expect(regionImage).toBeInTheDocument();

    component.unmount();
    testRegion = 'Asia';
    component = CustomRender(
      <MemoryRouter initialEntries={[`/${testRegion}`]}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
        </Routes>
      </MemoryRouter>,
    );

    regionTitle = screen.getByRole('heading', {
      name: /asia/i,
      level: 2,
    });

    regionImage = screen.getByRole('img', {
      name: /asia/i,
    });
    expect(regionTitle).toBeInTheDocument();
    expect(regionImage).toBeInTheDocument();

    component.unmount();
    testRegion = 'Oceania';
    component = CustomRender(
      <MemoryRouter initialEntries={[`/${testRegion}`]}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
        </Routes>
      </MemoryRouter>,
    );

    regionTitle = screen.getByRole('heading', {
      name: /oceania/i,
      level: 2,
    });

    regionImage = screen.getByRole('img', {
      name: /oceania/i,
    });
    expect(regionTitle).toBeInTheDocument();
    expect(regionImage).toBeInTheDocument();

    component.unmount();
    testRegion = 'Europe';
    component = CustomRender(
      <MemoryRouter initialEntries={[`/${testRegion}`]}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
        </Routes>
      </MemoryRouter>,
    );

    regionTitle = screen.getByRole('heading', {
      name: /europe/i,
      level: 2,
    });

    regionImage = screen.getByRole('img', {
      name: /europe/i,
    });
    expect(regionTitle).toBeInTheDocument();
    expect(regionImage).toBeInTheDocument();
  });

  test('Should render the search bar and the user should be able to type on it', async () => {
    const user = userEvent.setup();

    const searchBar = screen.getByRole('textbox');

    expect(searchBar).toBeInTheDocument();

    await user.type(searchBar, 'Hello');

    expect(searchBar.value).toMatch(/hello/i);
  });

  test('Should fetch the data from the countries API and display a list of countries', async () => {
    let list;

    // On first render, expect the list to not be null, since data haven't been fetched.
    list = screen.queryByRole('list');
    expect(list).toBeNull();

    // Wait for the list of countries to appear. Now, expect list to have length > 0;
    list = await screen.findAllByRole('listitem');
    expect(list.length).toBeGreaterThan(0);
  });

  test('should handle error gracefully', async () => {
    component.unmount();

    server.use(
      rest.get(/restcountries/i, (res, req, ctx) => res(ctx.status(404))),
    );

    CustomRender(
      <MemoryRouter initialEntries={[`/${testRegion}`]}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
        </Routes>
      </MemoryRouter>,
    );

    const errorText = await screen.findByText(/error/i);
    expect(errorText).toBeInTheDocument();
  });

  test('If user clicks a country, the correct component is rendered', async () => {
    const user = userEvent.setup();

    const listItem = await screen.findAllByRole('listitem');

    // Click the div that holds the country info
    await user.click(listItem[0].childNodes[0]);

    // Expect the dummy component in the nested route to be rendered
    const dummyCompTitle = screen.getByText(
      /south korea is a country/i,
    );

    expect(dummyCompTitle).toBeInTheDocument();
  });

  test('When user clicks back icon, desired component should render', async () => {
    component.unmount();
    const user = userEvent.setup();
    component = CustomRender(
      <MemoryRouter initialEntries={['/', '/America']}>
        <Routes>
          <Route path="/:regionName" element={<Region />} />
          <Route path="/" element={<div>Test passed</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const backIcon = screen.getByTestId('backBtn');
    await user.click(backIcon);

    const testPassedText = screen.getByText(/test passed/i);
    expect(testPassedText).toBeInTheDocument();
  });
});
