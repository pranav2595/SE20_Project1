import {expect} from 'chai'; 
import {shallow} from 'enzyme'; 
import { isMainThread } from 'worker_threads';
import App from social_media_client/src/App; 

const wrapper = shallow(<App />); 

describe('App Component Testing', function() {
    it('has MuiThemeProvider', function() {
        expect(wrapper.find('MuiThemeProvider')).to.equal(true);
    });

    it('has Router', function() {
        expect(wrapper.find('Router')).to.equal(true);
    });
    it('has Navbar', function() {
        expect(wrapper.find('Navbar')).to.equal(true);
    });

    it('has Switch', function() {
        expect(wrapper.find('Switch')).to.equal(true);
    });
});