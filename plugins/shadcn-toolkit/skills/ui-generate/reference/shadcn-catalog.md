# shadcn/ui Component Catalog

Quick reference for all available shadcn/ui components and when to use them.

## Layout & Structure

| Component | Use For | Install |
|-----------|---------|---------|
| Card | Content containers with header/content/footer | `npx shadcn@latest add card` |
| Separator | Visual dividers between sections | `npx shadcn@latest add separator` |
| Scroll Area | Custom scrollable regions | `npx shadcn@latest add scroll-area` |
| Resizable | Resizable panel layouts | `npx shadcn@latest add resizable` |
| Collapsible | Expandable/collapsible sections | `npx shadcn@latest add collapsible` |
| Accordion | Stacked expandable sections | `npx shadcn@latest add accordion` |
| Tabs | Tabbed content panels | `npx shadcn@latest add tabs` |
| Sheet | Side panel overlay | `npx shadcn@latest add sheet` |

## Forms & Input

| Component | Use For | Install |
|-----------|---------|---------|
| Form | Form wrapper with react-hook-form | `npx shadcn@latest add form` |
| Input | Text input field | `npx shadcn@latest add input` |
| Textarea | Multi-line text input | `npx shadcn@latest add textarea` |
| Select | Dropdown select | `npx shadcn@latest add select` |
| Checkbox | Toggle checkboxes | `npx shadcn@latest add checkbox` |
| Radio Group | Radio button groups | `npx shadcn@latest add radio-group` |
| Switch | Toggle switches | `npx shadcn@latest add switch` |
| Slider | Range slider | `npx shadcn@latest add slider` |
| Date Picker | Date selection (uses Calendar) | `npx shadcn@latest add calendar` |
| Combobox | Searchable select (uses Popover + Command) | `npx shadcn@latest add popover command` |

## Actions & Feedback

| Component | Use For | Install |
|-----------|---------|---------|
| Button | Clickable actions | `npx shadcn@latest add button` |
| Toggle | On/off toggle button | `npx shadcn@latest add toggle` |
| Toggle Group | Grouped toggles | `npx shadcn@latest add toggle-group` |
| Toast | Notification messages | `npx shadcn@latest add toast` |
| Sonner | Alternative toast (uses sonner lib) | `npx shadcn@latest add sonner` |
| Alert | Static alert messages | `npx shadcn@latest add alert` |
| Alert Dialog | Confirmation dialogs | `npx shadcn@latest add alert-dialog` |
| Dialog | Modal dialogs | `npx shadcn@latest add dialog` |
| Progress | Progress indicators | `npx shadcn@latest add progress` |
| Skeleton | Loading placeholders | `npx shadcn@latest add skeleton` |

## Navigation

| Component | Use For | Install |
|-----------|---------|---------|
| Navigation Menu | Main site navigation | `npx shadcn@latest add navigation-menu` |
| Menubar | Application menu bar | `npx shadcn@latest add menubar` |
| Dropdown Menu | Contextual dropdown menus | `npx shadcn@latest add dropdown-menu` |
| Context Menu | Right-click menus | `npx shadcn@latest add context-menu` |
| Command | Command palette (Cmd+K) | `npx shadcn@latest add command` |
| Breadcrumb | Breadcrumb navigation | `npx shadcn@latest add breadcrumb` |
| Pagination | Page navigation | `npx shadcn@latest add pagination` |
| Sidebar | Sidebar navigation | `npx shadcn@latest add sidebar` |

## Data Display

| Component | Use For | Install |
|-----------|---------|---------|
| Table | Data tables | `npx shadcn@latest add table` |
| Badge | Status labels/tags | `npx shadcn@latest add badge` |
| Avatar | User profile images | `npx shadcn@latest add avatar` |
| Tooltip | Hover information | `npx shadcn@latest add tooltip` |
| Hover Card | Rich hover previews | `npx shadcn@latest add hover-card` |
| Popover | Click-triggered popups | `npx shadcn@latest add popover` |
| Carousel | Image/content carousels | `npx shadcn@latest add carousel` |
| Chart | Data visualization (uses Recharts) | `npx shadcn@latest add chart` |
| Calendar | Calendar display | `npx shadcn@latest add calendar` |

## Common Combinations

| Pattern | Components |
|---------|-----------|
| Search bar | `Command` + `Dialog` |
| Data table with sorting | `Table` + `Button` + `Dropdown Menu` |
| Settings form | `Form` + `Input` + `Select` + `Switch` + `Button` |
| User menu | `Avatar` + `Dropdown Menu` |
| Confirmation flow | `Alert Dialog` + `Button` |
| File upload | `Input` (type=file) + `Progress` + `Toast` |
| Sidebar layout | `Sidebar` + `Sheet` (mobile) |
