import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

import React from 'react';
import { shallow } from "enzyme";
import NoteDetailModal from '../lib/screens/mapPage/NoteDetailModal.tsx';

jest.mock('../lib/components/ThemeProvider', () => ({
  useTheme: () => ({
      theme: 'mockedTheme', // Provide a mocked theme object
  }),
}));

describe("NoteDetailModal", () => {
  it("renders without crashing", () => {
    const wrapper = shallow(<NoteDetailModal />);
    expect(wrapper).toMatchSnapshot();
  });
});