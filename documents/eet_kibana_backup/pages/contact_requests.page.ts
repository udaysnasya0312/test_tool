import { ScreenPage } from './common.js';
export class ContactRequestsPage extends ScreenPage {
  // The page has two "Contact Requests" headings (h2 page title and an h4); use the page title.
  title = () => this.page.locator('h2', { hasText: 'Contact Requests' });
  open = async () => { await this.openPath('/contact-requests'); };
}
