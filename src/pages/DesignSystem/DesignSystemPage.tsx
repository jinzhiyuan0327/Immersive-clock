import {
  Bell,
  CalendarDays,
  Check,
  Cloud,
  Command,
  FileText,
  LayoutDashboard,
  ListChecks,
  Palette,
  Search,
  Settings,
  SlidersHorizontal,
  Upload,
  Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Alert,
  Badge,
  BarMeter,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  ColorPicker,
  CommandPalette,
  ConfirmDialog,
  ContextMenu,
  DataTable,
  DatePicker,
  Dropdown,
  EmptyState,
  ErrorBoundaryView,
  FilePicker,
  FilterBar,
  FloatingActionBar,
  FormRow,
  FormSection,
  Gauge,
  HUDLayer,
  IconButton,
  Input,
  KeyboardShortcut,
  KeyValueList,
  List,
  ListItem,
  Loading,
  Menu,
  Meter,
  Modal,
  NotificationCenter,
  NumberInput,
  PageShell,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  RichMenu,
  SearchInput,
  SegmentedControl,
  Select,
  SettingsShell,
  SideNav,
  Slider,
  Skeleton,
  SortButton,
  Sparkline,
  StatCard,
  Stepper,
  Switch,
  Tabs,
  Textarea,
  Timeline,
  TimePicker,
  Toast,
  ToastViewport,
  TopBar,
  Toolbar,
  Tooltip,
  VisuallyHidden,
  type SortDirection,
  type TimePickerValue,
  type ToastRecord,
} from "../../ui";

import styles from "./DesignSystemPage.module.css";

type ComponentSection =
  | "foundation"
  | "actions"
  | "forms"
  | "feedback"
  | "overlays"
  | "data"
  | "navigation"
  | "layout"
  | "utilities";

const navItems = [
  { value: "foundation", label: "设计基础" },
  { value: "actions", label: "按钮与选择" },
  { value: "forms", label: "表单输入" },
  { value: "feedback", label: "反馈状态" },
  { value: "overlays", label: "浮层菜单" },
  { value: "data", label: "数据展示" },
  { value: "navigation", label: "导航列表" },
  { value: "layout", label: "布局容器" },
  { value: "utilities", label: "底层工具" },
] satisfies Array<{ value: ComponentSection; label: string }>;

const swatches = [
  ["#0B0C0E", "背景"],
  ["#111317", "面板"],
  ["#1A1D22", "浮层"],
  ["#2A2E35", "边框"],
  ["#8E9098", "弱文本"],
  ["#EAECF0", "主文本"],
  ["#2FECC6", "强调"],
] as const;

const dropdownGroups = [
  {
    label: "页面",
    options: [
      { value: "clock", label: "时钟", description: "时间、日期、天气入口" },
      { value: "study", label: "自习", description: "专注统计与任务状态" },
      { value: "settings", label: "设置", description: "高密度参数面板" },
    ],
  },
  {
    label: "工具",
    options: [
      { value: "noise", label: "噪音监测", description: "分贝阈值与提醒" },
      { value: "quotes", label: "语录管理", description: "播报与刷新策略" },
    ],
  },
];

const featureOptions = [
  { value: "speech", label: "语音播报", description: "整点与休息提醒" },
  { value: "noise", label: "噪音监测", description: "分贝阈值提醒" },
  { value: "weather", label: "天气组件", description: "城市与缓存策略" },
  { value: "todo", label: "待办统计", description: "学习页任务追踪" },
];

function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState<ComponentSection>("foundation");
  const [segmentedValue, setSegmentedValue] = useState("study");
  const [checkboxValue, setCheckboxValue] = useState(true);
  const [radioValue, setRadioValue] = useState("auto");
  const [switchValue, setSwitchValue] = useState(true);
  const [sliderValue, setSliderValue] = useState(55);
  const [stepperValue, setStepperValue] = useState(25);
  const [numberValue, setNumberValue] = useState(45);
  const [colorValue, setColorValue] = useState("#2fecc6");
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(2);
  const [dropdownValue, setDropdownValue] = useState<string | number>("study");
  const [multiDropdownValue, setMultiDropdownValue] = useState<Array<string | number>>([
    "speech",
    "noise",
  ]);
  const [textareaValue, setTextareaValue] = useState("专注提醒在 25 分钟后播报，休息 5 分钟。");
  const [pickedFileName, setPickedFileName] = useState("");
  const [tabValue, setTabValue] = useState("basic");
  const [sideNavValue, setSideNavValue] = useState("overview");
  const [settingsSection, setSettingsSection] = useState("general");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 22));
  const [timeValue, setTimeValue] = useState<TimePickerValue>({
    hours: "12",
    minutes: "30",
    seconds: "00",
  });

  const settingsItems = useMemo(
    () => [
      { value: "general", label: "基础", icon: <Settings size={16} aria-hidden="true" /> },
      { value: "display", label: "显示", icon: <Palette size={16} aria-hidden="true" /> },
      { value: "audio", label: "声音", icon: <Volume2 size={16} aria-hidden="true" /> },
    ],
    [],
  );

  const toasts = useMemo<ToastRecord[]>(
    () => [
      {
        id: "sync",
        variant: "success",
        title: "组件库已同步",
        description: "用于全局通知队列和轻量操作反馈。",
      },
      {
        id: "warning",
        variant: "warning",
        title: "阈值接近上限",
        description: "可在设置页调整提醒策略。",
      },
    ],
    [],
  );

  const scrollToSection = (section: ComponentSection) => {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <main className={styles.page} data-ui-root>
      <aside className={styles.sidebar} aria-label="组件分类">
        <div className={styles.brand}>
          <Badge variant="accent">src/ui</Badge>
          <h1>组件库</h1>
          <p>暗色专业界面、青绿色主色、高密度控件、统一 tokens 与 CSS Modules。</p>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              className={activeSection === item.value ? styles.navItemActive : styles.navItem}
              key={item.value}
              type="button"
              onClick={() => scrollToSection(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className={styles.content}>
        <TopIntro />

        <section className={styles.section} id="foundation">
          <SectionHeader title="设计基础" meta="tokens.css / global-ui.css" />
          <div className={styles.gridTwo}>
            <Card className={styles.cardStack}>
              <h3>色彩</h3>
              <div className={styles.swatches}>
                {swatches.map(([color, label]) => (
                  <div className={styles.swatch} key={color}>
                    <span className={styles.swatchColor} style={{ background: color }} />
                    <span>{label}</span>
                    <code>{color}</code>
                  </div>
                ))}
              </div>
            </Card>
            <Card className={styles.cardStack}>
              <h3>字体与密度</h3>
              <div className={styles.typeRow}>
                <div>
                  <strong className={styles.typeSample}>Aa</strong>
                  <span>Inter / Source Han Sans</span>
                </div>
                <div>
                  <strong className={styles.numberSample}>15:39:52</strong>
                  <span>Roboto Mono 数字时间</span>
                </div>
              </div>
              <div className={styles.tokenRow}>
                {[4, 8, 12, 16, 24, 32].map((size) => (
                  <span key={size}>
                    <i style={{ width: size, height: size }} />
                    {size}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className={styles.section} id="actions">
          <SectionHeader title="按钮与选择" meta="Button / IconButton / Switch / Slider" />
          <ComponentGrid>
            <Card className={styles.cardStack}>
              <h3>Button</h3>
              <div className={styles.inlineRow}>
                <Button variant="primary">主按钮</Button>
                <Button variant="secondary">次按钮</Button>
                <Button variant="ghost">幽灵按钮</Button>
                <Button variant="danger">危险按钮</Button>
                <Button loading>加载中</Button>
              </div>
            </Card>
            <Card className={styles.cardStack}>
              <h3>IconButton / Toolbar</h3>
              <Toolbar aria-label="按钮组">
                <IconButton icon={<Settings size={16} />} aria-label="设置" active />
                <IconButton icon={<Volume2 size={16} />} aria-label="声音" />
                <IconButton icon={<Cloud size={16} />} aria-label="天气" />
              </Toolbar>
            </Card>
            <Card className={styles.cardStack}>
              <h3>SegmentedControl</h3>
              <SegmentedControl
                label="默认页面"
                value={segmentedValue}
                onChange={setSegmentedValue}
                options={[
                  { value: "clock", label: "时钟" },
                  { value: "countdown", label: "倒计时" },
                  { value: "study", label: "自习" },
                ]}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>Switch / Checkbox / Radio</h3>
              <div className={styles.inlineRow}>
                <Switch checked={switchValue} onCheckedChange={setSwitchValue} label="启用播报" />
                <Checkbox
                  label="记录状态"
                  checked={checkboxValue}
                  onChange={(event) => setCheckboxValue(event.target.checked)}
                />
              </div>
              <RadioGroup
                label="模式"
                value={radioValue}
                onChange={setRadioValue}
                options={[
                  { value: "auto", label: "自动" },
                  { value: "manual", label: "手动" },
                ]}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>Slider / Stepper / TimePicker</h3>
              <Slider
                label="提醒阈值"
                min={30}
                max={80}
                value={sliderValue}
                onChange={setSliderValue}
                formatValue={(value) => `${value} dB`}
              />
              <div className={styles.inlineRow}>
                <Stepper value={stepperValue} onChange={setStepperValue} min={0} max={99} />
                <TimePicker value={timeValue} onChange={setTimeValue} />
              </div>
            </Card>
          </ComponentGrid>
        </section>

        <section className={styles.section} id="forms">
          <SectionHeader title="表单输入" meta="Input / Dropdown / FormComponents / ColorPicker" />
          <div className={styles.gridTwo}>
            <FormSection title="FormSection / FormRow" description="统一表单标题、描述、字段网格和底部操作。">
              <FormRow>
                <Input label="计划名称" placeholder="例如：夜间专注计划" />
                <Select
                  label="年份"
                  value="2027"
                  onChange={() => undefined}
                  options={[
                    { value: "2026", label: "2026" },
                    { value: "2027", label: "2027" },
                    { value: "2028", label: "2028" },
                  ]}
                />
              </FormRow>
              <FormRow>
                <SearchInput
                  label="搜索组件"
                  value={searchValue}
                  placeholder="输入组件名称"
                  onChange={(event) => setSearchValue(event.target.value)}
                  onClear={() => setSearchValue("")}
                />
                <NumberInput
                  label="休息时长"
                  value={numberValue}
                  min={5}
                  max={120}
                  step={5}
                  suffix="min"
                  onChange={setNumberValue}
                />
              </FormRow>
              <FormRow>
                <ColorPicker
                  label="强调色"
                  value={colorValue}
                  onChange={(event) => setColorValue(event.target.value)}
                />
                <FilePicker
                  label="导入配置"
                  fileName={pickedFileName}
                  onFileChange={(file) => setPickedFileName(file?.name ?? "")}
                />
              </FormRow>
              <FormRow columns={1}>
                <Textarea
                  label="播报文案"
                  value={textareaValue}
                  onChange={(event) => setTextareaValue(event.target.value)}
                />
              </FormRow>
              <ButtonGroup>
                <Button variant="ghost">重置</Button>
                <Button variant="primary">保存</Button>
              </ButtonGroup>
            </FormSection>

            <FormSection title="Dropdown" description="支持单选、多选、分组、搜索和禁用。">
              <Dropdown
                label="分组搜索"
                value={dropdownValue}
                groups={dropdownGroups}
                searchable
                onChange={(nextValue) => {
                  if (typeof nextValue === "string" || typeof nextValue === "number") {
                    setDropdownValue(nextValue);
                  }
                }}
              />
              <Dropdown
                label="多选"
                mode="multiple"
                value={multiDropdownValue}
                options={featureOptions}
                searchable
                onChange={(nextValue) => setMultiDropdownValue(Array.isArray(nextValue) ? nextValue : [])}
              />
              <Input label="错误状态" defaultValue="错误示例" error="请检查输入内容" />
            </FormSection>
          </div>
        </section>

        <section className={styles.section} id="feedback">
          <SectionHeader title="反馈状态" meta="Alert / Toast / Loading / ConfirmDialog" />
          <ComponentGrid>
            <Card className={styles.cardStack}>
              <h3>Badge / Alert</h3>
              <div className={styles.inlineRow}>
                <Badge variant="neutral">默认</Badge>
                <Badge variant="accent">组件库</Badge>
                <Badge variant="success">已保存</Badge>
                <Badge variant="warning">待同步</Badge>
                <Badge variant="danger">异常</Badge>
              </div>
              <Alert variant="success">操作成功提示文案</Alert>
              <Alert variant="warning">警告提示文案</Alert>
            </Card>
            <Card className={styles.cardStack}>
              <h3>Toast / NotificationCenter</h3>
              <Toast variant="success" title="单条通知" description="用于轻量级操作反馈。" />
              <NotificationCenter
                items={[
                  {
                    id: "sync",
                    title: "组件库已注册",
                    description: "新组件已进入 src/ui 统一出口。",
                    time: "刚刚",
                    unread: true,
                  },
                  {
                    id: "audit",
                    title: "等待业务迁移",
                    description: "当前阶段只建设组件库。",
                    time: "下一阶段",
                  },
                ]}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>Loading / Skeleton / Progress</h3>
              <Loading label="同步本地设置" />
              <Skeleton lines={4} />
              <Progress value={70} label="示例进度" />
            </Card>
            <Card className={styles.cardStack}>
              <h3>ConfirmDialog / ErrorBoundaryView</h3>
              <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                打开确认弹窗
              </Button>
              <ErrorBoundaryView
                title="错误视图"
                description="用于 ErrorBoundary fallback、加载失败或不可恢复状态。"
                action={<Button size="sm">重试</Button>}
              />
            </Card>
          </ComponentGrid>
        </section>

        <section className={styles.section} id="overlays">
          <SectionHeader title="浮层菜单" meta="Modal / Popover / Menu / ContextMenu / CommandPalette" />
          <ComponentGrid>
            <Card className={styles.cardStack}>
              <h3>Modal</h3>
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                打开弹窗
              </Button>
            </Card>
            <Card className={styles.cardStack}>
              <h3>Popover / Tooltip</h3>
              <div className={styles.inlineRow}>
                <Popover ariaLabel="弹出内容" trigger={<span>打开弹出层</span>}>
                  <div className={styles.popoverDemo}>
                    <strong>弹出层内容</strong>
                    <span>用于轻量设置、筛选和上下文信息。</span>
                    <Button size="sm" variant="primary">
                      应用
                    </Button>
                  </div>
                </Popover>
                <Tooltip content="提示显示在按钮上方">
                  <IconButton icon={<Search size={16} />} aria-label="查看提示" />
                </Tooltip>
              </div>
            </Card>
            <Card className={styles.cardStack}>
              <h3>Menu / RichMenu</h3>
              <div className={styles.inlineRow}>
                <Menu
                  triggerLabel="基础菜单"
                  items={[
                    { value: "edit", label: "编辑", icon: <FileText size={15} /> },
                    { value: "sync", label: "同步", icon: <Cloud size={15} />, selected: true },
                  ]}
                />
                <RichMenu
                  label="分组菜单"
                  items={[
                    {
                      type: "group",
                      label: "常用",
                      items: [
                        {
                          type: "item",
                          value: "search",
                          label: "搜索",
                          icon: <Search size={15} />,
                          shortcut: <KeyboardShortcut keys={["Ctrl", "K"]} />,
                        },
                        { type: "item", value: "settings", label: "设置", icon: <Settings size={15} /> },
                      ],
                    },
                    { type: "divider" },
                    { type: "item", value: "danger", label: "危险操作", disabled: true },
                  ]}
                />
              </div>
            </Card>
            <Card className={styles.cardStack}>
              <h3>ContextMenu / CommandPalette</h3>
              <ContextMenu
                items={[
                  { type: "item", value: "open", label: "打开" },
                  { type: "item", value: "copy", label: "复制", shortcut: <KeyboardShortcut keys={["Ctrl", "C"]} /> },
                  { type: "divider" },
                  { type: "item", value: "delete", label: "删除", disabled: true },
                ]}
              >
                <div className={styles.contextTarget}>右键打开上下文菜单</div>
              </ContextMenu>
              <Button variant="secondary" onClick={() => setCommandOpen(true)}>
                打开命令面板
              </Button>
            </Card>
            <Card className={styles.cardStack}>
              <h3>DatePicker</h3>
              <DatePicker value={selectedDate} onChange={setSelectedDate} />
            </Card>
          </ComponentGrid>
        </section>

        <section className={styles.section} id="data">
          <SectionHeader title="数据展示" meta="DataTable / FilterBar / Timeline / Gauge / KeyValueList" />
          <ComponentGrid>
            <Card className={styles.cardStack}>
              <h3>FilterBar / SortButton / Pagination</h3>
              <FilterBar
                searchValue={filterValue}
                searchPlaceholder="搜索模块"
                onSearchChange={setFilterValue}
                onClear={() => setFilterValue("")}
                chips={[
                  { value: "all", label: "全部", active: true },
                  { value: "new", label: "新增" },
                  { value: "risk", label: "风险" },
                ]}
                actions={
                  <SortButton label="名称" direction={sortDirection} onChange={setSortDirection} />
                }
              />
              <Pagination page={page} pageCount={5} onPageChange={setPage} />
            </Card>
            <Card className={styles.cardStack}>
              <h3>DataTable</h3>
              <DataTable
                rows={[
                  { id: "clock", name: "时钟", status: "已注册", count: 12 },
                  { id: "settings", name: "设置", status: "迁移中", count: 8 },
                  { id: "study", name: "自习", status: "待迁移", count: 15 },
                ]}
                getRowKey={(row) => row.id}
                columns={[
                  { key: "name", header: "模块", render: (row) => row.name },
                  { key: "status", header: "状态", render: (row) => <Badge variant="accent">{row.status}</Badge> },
                  { key: "count", header: "组件", align: "right", render: (row) => row.count },
                ]}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>KeyValueList / Timeline</h3>
              <KeyValueList
                items={[
                  { key: "version", label: "版本", value: "UI v1", meta: "src/ui" },
                  { key: "theme", label: "主题", value: "Dark Professional" },
                  { key: "radius", label: "圆角", value: "8px" },
                ]}
              />
              <Timeline
                items={[
                  { id: "1", title: "组件库注册", time: "09:10", status: "success" },
                  { id: "2", title: "补齐数据控件", time: "10:20", status: "accent" },
                  { id: "3", title: "业务页迁移", time: "下一阶段", status: "default" },
                ]}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>StatCard / Sparkline / Gauge / Meter</h3>
              <StatCard title="本周专注" value="18.4h" meta="近 7 天">
                <BarMeter values={[32, 54, 48, 70, 62, 76, 58]} label="本周专注柱状图" />
              </StatCard>
              <Sparkline
                values={[48, 52, 46, 50, 42, 48, 38, 51, 44, 47, 31, 51, 42, 49]}
                label="实时监测折线图"
                min={30}
                max={55}
              />
              <div className={styles.gridTwoCompact}>
                <Gauge value={52} max={80} label="环境噪音" unit="dB" />
                <Meter value={64} label="完成度" />
              </div>
            </Card>
          </ComponentGrid>
        </section>

        <section className={styles.section} id="navigation">
          <SectionHeader title="导航列表" meta="Breadcrumb / Tabs / List / SideNav / TopBar" />
          <div className={styles.gridTwo}>
            <Card className={styles.cardStack}>
              <h3>Breadcrumb / TopBar</h3>
              <Breadcrumb
                items={[
                  { label: "组件库", href: "#" },
                  { label: "导航" },
                  { label: "当前页", current: true },
                ]}
              />
              <TopBar
                title="导航栏"
                subtitle="用于页面顶部标题、上下文和操作入口"
                leading={<IconButton icon={<LayoutDashboard size={16} />} aria-label="概览" />}
                actions={<Button size="sm" variant="primary">保存</Button>}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>Tabs / SideNav</h3>
              <Tabs
                label="组件分类"
                value={tabValue}
                onChange={setTabValue}
                items={[
                  { value: "basic", label: "基础", icon: <LayoutDashboard size={15} /> },
                  { value: "forms", label: "表单", icon: <FileText size={15} /> },
                  { value: "feedback", label: "反馈", icon: <Bell size={15} /> },
                ]}
              />
              <SideNav
                label="侧边导航"
                value={sideNavValue}
                onChange={setSideNavValue}
                items={[
                  { value: "overview", label: "总览", icon: <LayoutDashboard size={15} />, badge: "8" },
                  { value: "tasks", label: "任务", icon: <ListChecks size={15} /> },
                  { value: "settings", label: "设置", icon: <Settings size={15} /> },
                ]}
              />
            </Card>
            <Card className={styles.cardStack}>
              <h3>List / ListItem</h3>
              <List>
                <ListItem
                  title="系统通知"
                  description="组件库已注册"
                  icon={<Bell size={16} />}
                  trailing={<Badge variant="success">新</Badge>}
                />
                <ListItem
                  title="学习计划"
                  description="今日剩余 2 项"
                  icon={<ListChecks size={16} />}
                  trailing={<Check size={16} />}
                />
              </List>
            </Card>
          </div>
        </section>

        <section className={styles.section} id="layout">
          <SectionHeader title="布局容器" meta="Card / SettingsShell / PageShell / HUDLayer / FloatingActionBar" />
          <div className={styles.gridTwo}>
            <SettingsShell
              title="SettingsShell"
              activeItem={settingsSection}
              items={settingsItems}
              onItemChange={setSettingsSection}
              footer={
                <>
                  <Button variant="secondary">取消</Button>
                  <Button variant="primary">保存</Button>
                </>
              }
            >
              <FormSection title="设置页容器" description="用于后续承载高密度设置页面。">
                <Input label="字段" placeholder="输入内容" />
                <Switch checked={switchValue} onCheckedChange={setSwitchValue} label="开关项" />
              </FormSection>
            </SettingsShell>

            <PageShell
              sidebar={
                <div className={styles.shellStack}>
                  <Badge variant="accent">PageShell</Badge>
                  <span>侧边区域</span>
                </div>
              }
              topbar={<strong>顶部区域</strong>}
              footer={<span className={styles.muted}>底部操作区</span>}
            >
              <HUDLayer
                topLeft={<Badge variant="success">左上</Badge>}
                topRight={<Badge variant="accent">右上</Badge>}
                center={<strong className={styles.centerLabel}>HUDLayer</strong>}
                bottomLeft={<Button size="sm">左下</Button>}
                bottomRight={<Progress value={64} label="布局进度" />}
              />
            </PageShell>
            <Card className={styles.cardStack}>
              <h3>FloatingActionBar</h3>
              <FloatingActionBar aria-label="悬浮操作栏">
                <IconButton icon={<Settings size={16} />} aria-label="设置" active />
                <IconButton icon={<Volume2 size={16} />} aria-label="声音" />
                <IconButton icon={<Cloud size={16} />} aria-label="天气" />
              </FloatingActionBar>
            </Card>
          </div>
        </section>

        <section className={styles.section} id="utilities">
          <SectionHeader title="底层工具" meta="Portal / FocusTrap / VisuallyHidden / KeyboardShortcut" />
          <ComponentGrid>
            <Card className={styles.cardStack}>
              <h3>VisuallyHidden</h3>
              <p className={styles.muted}>为图标按钮、纯视觉状态和辅助说明提供屏幕阅读器文本。</p>
              <Button icon={<Command size={15} />}>
                <VisuallyHidden>打开快捷命令</VisuallyHidden>
                快捷命令
              </Button>
            </Card>
            <Card className={styles.cardStack}>
              <h3>KeyboardShortcut</h3>
              <div className={styles.inlineRow}>
                <KeyboardShortcut keys={["Ctrl", "K"]} />
                <KeyboardShortcut keys={["Esc"]} />
                <KeyboardShortcut keys={["Shift", "Tab"]} />
              </div>
            </Card>
            <Card className={styles.cardStack}>
              <h3>EmptyState</h3>
              <EmptyState
                icon={<CalendarDays size={18} />}
                title="暂无记录"
                description="空列表、首次启动和筛选无结果时使用。"
                action={<Button size="sm">新建</Button>}
              />
            </Card>
          </ComponentGrid>
        </section>
      </section>

      <Modal
        isOpen={modalOpen}
        title="弹窗组件"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              确认
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>标准弹窗结构：标题、内容区、关闭按钮和底部操作。</p>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="确认保存更改？"
        description="此组件用于危险操作、覆盖保存和离开页面前确认。"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
      />

      <CommandPalette
        isOpen={commandOpen}
        title="命令面板"
        onClose={() => setCommandOpen(false)}
        items={[
          { value: "open-settings", label: "打开设置", description: "跳转到设置容器", icon: <Settings size={16} /> },
          { value: "toggle-sound", label: "切换声音", description: "启用或关闭播报", icon: <Volume2 size={16} /> },
          { value: "search-components", label: "搜索组件", description: "查找组件库条目", icon: <Search size={16} /> },
        ]}
      />
      <ToastViewport toasts={toasts} onDismiss={() => undefined} />
    </main>
  );
}

function TopIntro() {
  return (
    <header className={styles.header}>
      <div>
        <span className={styles.kicker}>Immersive Clock UI</span>
        <h2>组件库总览</h2>
      </div>
      <Toolbar aria-label="组件库工具栏">
        <IconButton icon={<Search size={16} />} aria-label="搜索组件" />
        <IconButton icon={<SlidersHorizontal size={16} />} aria-label="筛选组件" />
        <Button size="sm" variant="primary" icon={<Upload size={14} />}>
          导出规范
        </Button>
      </Toolbar>
    </header>
  );
}

function SectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <header className={styles.sectionHeader}>
      <h2>{title}</h2>
      <span>{meta}</span>
    </header>
  );
}

function ComponentGrid({ children }: { children: ReactNode }) {
  return <div className={styles.componentGrid}>{children}</div>;
}

export { DesignSystemPage };
