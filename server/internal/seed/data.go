package seed

// ChapterData 章节数据
type ChapterData struct {
	ChapterNo int              `json:"chapter_no"`
	Title     string           `json:"title"`
	Summary   string           `json:"summary"`
	Points    []KnowledgePoint `json:"points"`
}

// KnowledgePoint 知识点
type KnowledgePoint struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// Chapters 20章完整知识体系数据
var Chapters = []ChapterData{
	{
		ChapterNo: 1, Title: "绪论", Summary: "系统架构基本概念、架构设计师职责与能力要求",
		Points: []KnowledgePoint{
			{Title: "系统架构的定义", Content: "架构是体现在组件中的一个系统的基本组织、它们彼此的关系与环境的关系及指导它的设计和发展的原则。系统架构是系统的一种整体的高层次的结构表示，是系统的骨架和根基。"},
			{Title: "软件架构发展历程", Content: "软件架构经历了四个阶段：基础研究阶段(1968-1994)、概念体系和核心技术形成阶段(1999-2000)、架构体系完善阶段(2000-2009)、普及应用阶段(2010至今)。"},
			{Title: "架构设计师的定义与职责", Content: "系统架构设计师是项目开发活动中的关键角色，负责确认和评估系统需求、给出开发规范、搭建系统实现的核心构架、澄清技术细节。"},
			{Title: "架构设计师的能力要求", Content: "精通专业基础知识，具备丰富的实际工作经验，具有跨学科能力和把握系统整体设计的能力。"},
			{Title: "从工程师到架构设计师的演化", Content: "需要从技术深度向系统广度转变，从实现细节向架构决策转变，从单一领域向跨领域综合转变。"},
		},
	},
	{
		ChapterNo: 2, Title: "计算机系统基础知识", Summary: "计算机硬件、软件、网络、嵌入式系统、多媒体、系统工程与性能",
		Points: []KnowledgePoint{
			{Title: "计算机硬件组成", Content: "冯·诺伊曼结构：运算器、控制器、存储器、输入设备、输出设备五部分组成，内部运算采用二进制。"},
			{Title: "操作系统", Content: "操作系统管理计算机硬件和软件资源，提供用户与硬件之间的接口，核心功能包括进程管理、内存管理、文件系统、设备管理。"},
			{Title: "计算机网络技术", Content: "包括局域网(LAN)、广域网(WAN)、城域网(MAN)，通信技术包括电路交换、分组交换、报文交换。"},
			{Title: "嵌入式系统", Content: "嵌入式系统是为特定应用而专门构建的计算机系统，具有专用性强、实时性强、可靠性高、资源受限等特点。"},
			{Title: "系统性能评估", Content: "性能指标包括响应时间、吞吐量、资源利用率；评估方法有测量法、模型法、分析法。"},
		},
	},
	{
		ChapterNo: 3, Title: "信息系统基础知识", Summary: "信息系统分类：TPS/MIS/DSS/ES/OAS/ERP及典型架构模型",
		Points: []KnowledgePoint{
			{Title: "信息系统定义", Content: "信息系统是由计算机硬件、软件、网络、数据资源和人力资源组成的，用于收集、处理、存储和分发信息的系统。"},
			{Title: "业务处理系统(TPS)", Content: "TPS是用于处理日常业务交易的系统，特点是处理量大、实时性强、数据准确性要求高。"},
			{Title: "管理信息系统(MIS)", Content: "MIS在TPS基础上提供管理决策支持，具有数据分析、报表生成、预测等功能。"},
			{Title: "决策支持系统(DSS)", Content: "DSS通过模型库、方法库、知识库为管理者提供决策支持，强调半结构化问题的求解。"},
			{Title: "企业资源规划(ERP)", Content: "ERP将企业各业务流程集成，实现信息流、物流、资金流的统一管理，核心是打破信息孤岛。"},
		},
	},
	{
		ChapterNo: 4, Title: "信息安全技术基础知识", Summary: "加密解密、密钥管理、访问控制、数字签名、抗攻击技术",
		Points: []KnowledgePoint{
			{Title: "信息安全三要素", Content: "机密性(Confidentiality)、完整性(Integrity)、可用性(Availability)，简称CIA。"},
			{Title: "对称密钥加密", Content: "加密和解密使用同一密钥，代表算法有DES(56位)、AES(128/192/256位)、SM4(国密)。优点是速度快，缺点是密钥分发困难。"},
			{Title: "非对称密钥加密", Content: "公钥加密、私钥解密，代表算法有RSA、ECC、SM2(国密)。解决了密钥分发问题，但速度较慢。"},
			{Title: "数字签名技术", Content: "发送方用私钥签名，接收方用公钥验证。保证消息的真实性、完整性和不可抵赖性。"},
			{Title: "访问控制模型", Content: "包括自主访问控制(DAC)、强制访问控制(MAC)、基于角色的访问控制(RBAC)、基于属性的访问控制(ABAC)。"},
			{Title: "常见攻击与防御", Content: "DoS/DDoS攻击、SQL注入、XSS跨站脚本、CSRF跨站请求伪造、中间人攻击、重放攻击。"},
		},
	},
	{
		ChapterNo: 5, Title: "软件工程基础知识", Summary: "软件过程模型、需求工程、系统分析与设计、软件测试、项目管理",
		Points: []KnowledgePoint{
			{Title: "软件过程模型", Content: "瀑布模型(线性)、原型模型(迭代)、螺旋模型(风险驱动)、增量模型(逐步交付)、敏捷模型(Scrum/XP/Kanban)。"},
			{Title: "统一过程(RUP)", Content: "RUP是以用例驱动、以架构为中心、迭代和增量的软件开发过程，包含四个阶段：初始、细化、构建、移交。"},
			{Title: "能力成熟度模型(CMM/CMMI)", Content: "CMM五级：初始级(无序)、可重复级(基本项目管理)、已定义级(标准化)、量化管理级(可度量)、优化级(持续改进)。"},
			{Title: "需求工程", Content: "包括需求获取、需求分析、需求规格说明、需求验证、需求变更管理。需求分为功能需求和非功能需求。"},
			{Title: "软件测试方法", Content: "白盒测试(路径覆盖、语句覆盖)、黑盒测试(等价类、边界值)、灰盒测试。测试阶段：单元测试、集成测试、系统测试、验收测试。"},
			{Title: "软件项目管理", Content: "包括进度管理(甘特图、PERT图)、配置管理(版本控制、变更控制)、质量管理(评审、审计)、风险管理(识别、分析、应对)。"},
		},
	},
	{
		ChapterNo: 6, Title: "数据库设计基础知识", Summary: "关系数据库、数据库设计步骤、数据交互、NoSQL",
		Points: []KnowledgePoint{
			{Title: "数据库三级模式", Content: "外模式(用户视图)、概念模式(全局逻辑结构)、内模式(物理存储结构)。两级映像保证数据独立性。"},
			{Title: "关系数据库设计理论", Content: "函数依赖、范式(NF)：1NF(原子性)、2NF(消除部分依赖)、3NF(消除传递依赖)、BCNF(主属性也不依赖)。"},
			{Title: "数据库设计步骤", Content: "需求分析 -> 概念结构设计(E-R图) -> 逻辑结构设计(关系模式) -> 物理设计(索引/分区) -> 实施 -> 运行维护。"},
			{Title: "ORM与数据交互", Content: "对象关系映射(ORM)将面向对象模型映射到关系模型，常见框架有Hibernate、MyBatis、GORM。"},
			{Title: "NoSQL数据库分类", Content: "键值型(Redis)、文档型(MongoDB)、列族型(HBase)、图型(Neo4j)。特点：去范式、水平扩展、最终一致性。"},
		},
	},
	{
		ChapterNo: 7, Title: "系统架构设计基础知识", Summary: "架构概念、ABSD方法、架构风格、架构复用、DSSA",
		Points: []KnowledgePoint{
			{Title: "软件架构定义", Content: "软件架构是系统的高层次结构表示，包含软件组件、组件的外部可见属性及它们之间的关系。"},
			{Title: "基于架构的软件开发(ABSD)", Content: "ABSD以架构为核心驱动开发过程，包括架构需求、设计、文档化、复审、实现、演化六个活动。"},
			{Title: "架构风格分类", Content: "数据流风格(批处理/管道)、调用返回风格(主程序子程序/面向对象/层次)、独立构件风格(进程通信/事件驱动)、虚拟机风格(解释器/规则系统)、以数据为中心(数据库/黑板)。"},
			{Title: "软件架构复用", Content: "架构复用可减少开发成本、提高质量、缩短周期。复用对象包括架构模式、组件、框架。"},
			{Title: "特定领域软件架构(DSSA)", Content: "DSSA是在特定应用领域内共享的软件架构，包含领域分析、领域设计、领域实现三个基本活动。"},
		},
	},
	{
		ChapterNo: 8, Title: "系统质量属性与架构评估", Summary: "质量属性场景、ATAM评估方法",
		Points: []KnowledgePoint{
			{Title: "质量属性六要素", Content: "可用性(Availability)、可靠性(Reliability)、性能(Performance)、安全性(Security)、可修改性(Modifiability)、可测试性(Testability)。"},
			{Title: "质量属性场景描述", Content: "场景由六部分组成：刺激源、刺激、制品、环境、响应、响应度量。用于精确描述质量属性需求。"},
			{Title: "架构评估方法", Content: "基于调查问卷/检查表的方法、基于场景的方法(ATAM/SAAM)、基于度量的方法。"},
			{Title: "ATAM方法", Content: "架构权衡分析法，分四个阶段：演示、调查分析、测试、报告。识别风险点、敏感点、权衡点。"},
			{Title: "SAAM方法", Content: "软件架构分析法，最初的场景评估方法，侧重可修改性评估。"},
		},
	},
	{
		ChapterNo: 9, Title: "软件可靠性基础知识", Summary: "可靠性定义、建模、设计、测试与评价",
		Points: []KnowledgePoint{
			{Title: "软件可靠性定义", Content: "软件可靠性是软件在规定条件下、规定时间内不引起系统故障的能力。定量描述：MTTF(平均故障时间)、MTBF(平均故障间隔时间)。"},
			{Title: "可靠性设计技术", Content: "容错设计(N版本编程/恢复块)、检错技术(超时/心跳/表决)、降低复杂度设计。"},
			{Title: "系统配置技术", Content: "主动冗余(双机热备)、被动冗余(双工模式)、N版本冗余(多版本并行)。"},
			{Title: "软件可靠性测试", Content: "通过运行剖面生成测试用例，在真实或模拟环境下执行测试，收集故障数据。"},
			{Title: "可靠性评价", Content: "选择可靠性模型(Musa模型/JM模型)、收集失效数据、进行可靠性评估和预测。"},
		},
	},
	{
		ChapterNo: 10, Title: "软件架构的演化和维护", Summary: "演化方式分类、演化原则、大型网站架构演化实例",
		Points: []KnowledgePoint{
			{Title: "架构演化定义", Content: "架构演化是在软件生命周期中，为适应需求和环境变化而对架构进行的调整和改变。"},
			{Title: "演化方式分类", Content: "按时期：静态演化(设计时/运行时)、动态演化(运行时替换)。按层次：对象/消息/复合片段/约束演化。"},
			{Title: "架构演化原则", Content: "演化成本控制、需求变化分析、抽象层稳定、模块化、可追溯性、前向兼容。"},
			{Title: "大型网站架构演化", Content: "单体架构 -> 垂直拆分 -> 分布式服务 -> 缓存 -> CDN -> 分布式文件系统 -> NoSQL -> 搜索引擎 -> 微服务 -> 中台化。"},
			{Title: "架构维护", Content: "包括知识管理、修改管理(变更影响分析)、版本管理、可维护性度量。"},
		},
	},
	{
		ChapterNo: 11, Title: "未来信息综合技术", Summary: "CPS、AI、机器人、边缘计算、数字孪生、云计算与大数据",
		Points: []KnowledgePoint{
			{Title: "信息物理系统(CPS)", Content: "CPS是物理世界与信息世界深度融合的系统，通过感知、计算、通信和控制实现物理过程的监控和协同。"},
			{Title: "人工智能关键技术", Content: "机器学习(监督/无监督/强化学习)、深度学习(CNN/RNN/Transformer)、自然语言处理、计算机视觉。"},
			{Title: "边缘计算", Content: "边缘计算将计算和存储资源部署在靠近数据源的网络边缘，降低延迟、节省带宽、保护隐私。边云协同是核心。"},
			{Title: "数字孪生", Content: "数字孪生是物理实体的数字化映射，通过数据同步实现虚实交互，关键技术包括建模、仿真、数据采集、实时通信。"},
			{Title: "云计算服务模型", Content: "IaaS(基础设施即服务)、PaaS(平台即服务)、SaaS(软件即服务)。部署模型：公有云、私有云、混合云。"},
		},
	},
	{
		ChapterNo: 12, Title: "信息系统架构设计理论与实践", Summary: "信息系统架构风格、分类、企业总体框架、ADM方法",
		Points: []KnowledgePoint{
			{Title: "信息系统架构分类", Content: "集中式架构、分布式架构、C/S架构、B/S架构、SOA架构、微服务架构。"},
			{Title: "企业总体框架(TOGAF)", Content: "TOGAF包括业务架构、应用架构、数据架构、技术架构四个领域。"},
			{Title: "ADM架构开发方法", Content: "TOGAF的ADM方法包含8个阶段：预备、架构愿景、业务架构、信息系统架构、技术架构、机会与方案、迁移规划、实施治理。"},
			{Title: "信息化总体架构方法", Content: "包括业务架构设计、应用架构设计、数据架构设计、技术架构设计四个层次。"},
		},
	},
	{
		ChapterNo: 13, Title: "层次式架构设计理论与实践", Summary: "表现层、中间层、数据访问层、数据架构、物联网层次架构",
		Points: []KnowledgePoint{
			{Title: "层次式架构概述", Content: "层次式架构将系统分为多个层次，每层只与相邻层交互。常见三层架构：表现层、业务逻辑层、数据访问层。"},
			{Title: "表现层设计", Content: "MVC模式(Model-View-Controller)、MVP模式(Model-View-Presenter)、MVVM模式(Model-View-ViewModel)。"},
			{Title: "中间层架构设计", Content: "业务逻辑层组件包括业务实体、业务组件、业务流程、工作流。使用工厂模式、策略模式等设计模式。"},
			{Title: "数据访问层设计", Content: "数据访问模式包括DAO模式、Repository模式。ORM框架实现对象关系映射，事务管理确保数据一致性。"},
			{Title: "物联网层次架构", Content: "物联网四层架构：感知层、网络层、平台层、应用层。"},
		},
	},
	{
		ChapterNo: 14, Title: "云原生架构设计理论与实践", Summary: "容器、微服务、无服务器、服务网格",
		Points: []KnowledgePoint{
			{Title: "云原生定义", Content: "云原生是构建和运行云应用程序的方法，核心原则：微服务、容器、DevOps、持续交付。"},
			{Title: "云原生架构原则", Content: "安全、弹性、可观测、自动化、零信任、架构演进。"},
			{Title: "容器技术", Content: "Docker容器化部署，Kubernetes容器编排。容器相比虚拟机更轻量，启动更快，资源利用率更高。"},
			{Title: "微服务架构", Content: "将单体应用拆分为独立部署的小服务，每个服务有自己的数据库。优点：独立部署、技术栈灵活、故障隔离。缺点：分布式复杂度、数据一致性。"},
			{Title: "服务网格", Content: "Istio/Linkerd提供服务间通信的基础设施层，功能包括流量管理、安全、可观测性。Sidecar模式。"},
			{Title: "无服务器(Serverless)", Content: "FaaS(函数即服务)按需执行，无需管理服务器。适合事件驱动、短时任务。"},
		},
	},
	{
		ChapterNo: 15, Title: "面向服务架构设计理论与实践", Summary: "SOA概述、关键技术、微服务",
		Points: []KnowledgePoint{
			{Title: "SOA定义", Content: "面向服务架构(SOA)是一种将应用程序分解为松耦合、可重用服务的架构风格，服务通过标准接口通信。"},
			{Title: "SOA关键技术", Content: "Web服务(SOAP/WSDL/UDDI)、企业服务总线(ESB)、服务注册与发现、BPEL业务流程编排。"},
			{Title: "SOA与微服务的区别", Content: "SOA强调企业级集成，使用ESB；微服务强调独立部署，去中心化，每个服务有自己的数据库。"},
			{Title: "RESTful API设计", Content: "资源用URI标识，用HTTP方法操作(GET/POST/PUT/DELETE)，无状态通信，使用JSON/XML表示。"},
		},
	},
	{
		ChapterNo: 16, Title: "嵌入式系统架构设计理论与实践", Summary: "嵌入式硬件、操作系统、数据库、中间件、开发环境",
		Points: []KnowledgePoint{
			{Title: "嵌入式系统特点", Content: "专用性强、实时性要求高、资源受限(内存/CPU)、可靠性要求高、功耗敏感。"},
			{Title: "嵌入式操作系统", Content: "RTOS实时操作系统：VxWorks、FreeRTOS、uC/OS。通用嵌入式OS：嵌入式Linux、Android、鸿蒙。"},
			{Title: "嵌入式软件架构", Content: "层次架构和微内核架构是两种典型模式。GOA通用开放架构提供层次化框架。"},
			{Title: "嵌入式数据库", Content: "SQLite(文件型)、eXtremeDB(内存型)、Berkeley DB(键值型)。嵌入式数据库嵌入应用程序进程，无需独立服务。"},
		},
	},
	{
		ChapterNo: 17, Title: "通信系统架构设计理论与实践", Summary: "网络架构、组网技术、SDN、网络安全",
		Points: []KnowledgePoint{
			{Title: "网络架构分类", Content: "局域网(以太网/WiFi)、广域网(MPLS/SDH)、移动通信网(4G/5G)、存储网络(SAN/NAS)、软件定义网络(SDN)。"},
			{Title: "SDN软件定义网络", Content: "SDN将控制平面与数据平面分离，通过OpenFlow协议集中控制网络。优势：灵活编程、集中管理、快速创新。"},
			{Title: "网络高可用设计", Content: "冗余设计(双机热备/集群)、链路聚合(LACP)、虚拟路由冗余(VRRP)、负载均衡。"},
			{Title: "IPv4与IPv6融合", Content: "双栈技术、隧道技术(6to4/ISATAP)、NAT64/DNS64转换技术。"},
		},
	},
	{
		ChapterNo: 18, Title: "安全架构设计理论与实践", Summary: "安全模型、WPDRRC、网络安全体系、数据库安全",
		Points: []KnowledgePoint{
			{Title: "安全模型", Content: "Bell-LaPadula(机密性模型，不上读不下写)、Biba(完整性模型，不下读不上写)、Clark-Wilson(事务完整性)、Chinese Wall(利益冲突隔离)。"},
			{Title: "WPDRRC模型", Content: "预警(Warning)、保护(Protect)、检测(Detect)、响应(React)、恢复(Restore)、反击(Counter)。"},
			{Title: "OSI安全体系", Content: "五类安全服务：认证、访问控制、数据机密性、数据完整性、抗抵赖。八种安全机制：加密、数字签名、访问控制、数据完整性、交换认证、流量填充、路由控制、公证。"},
			{Title: "系统架构脆弱性", Content: "缓冲区溢出、SQL注入、XSS、CSRF、不安全的反序列化、权限提升。架构层面需纵深防御。"},
		},
	},
	{
		ChapterNo: 19, Title: "大数据架构设计理论与实践", Summary: "Lambda架构、Kappa架构、大数据处理",
		Points: []KnowledgePoint{
			{Title: "大数据特征(5V)", Content: "Volume(大量)、Velocity(高速)、Variety(多样)、Value(低价值密度)、Veracity(真实性)。"},
			{Title: "Lambda架构", Content: "分层架构：批处理层(Batch Layer) + 速度层(Speed Layer) + 服务层(Serving Layer)。批处理提供全量计算，速度层提供实时增量。"},
			{Title: "Kappa架构", Content: "Kappa简化Lambda，只保留流处理层，用Kafka等消息队列作为唯一数据源，所有计算都是流式计算。"},
			{Title: "Lambda vs Kappa", Content: "Lambda适合复杂场景(批+流)，维护两套代码；Kappa简单统一，但流式计算精度可能不如批处理。"},
			{Title: "大数据技术栈", Content: "Hadoop(HDFS/MapReduce)、Spark(内存计算)、Flink(流式计算)、Kafka(消息队列)、HBase(列式存储)。"},
		},
	},
	{
		ChapterNo: 20, Title: "系统架构设计师论文写作要点", Summary: "论文格式、写作方法、摘要与正文",
		Points: []KnowledgePoint{
			{Title: "论文格式要求", Content: "摘要300字以内，正文2000-3000字。选题四选一，考试时间120分钟。"},
			{Title: "论文写作步骤", Content: "1.审题选题目 2.列提纲 3.写摘要 4.写正文 5.检查修改。"},
			{Title: "摘要写法", Content: "摘要包含：项目背景(一句话)、你的角色(架构师)、遇到的问题、解决方案、效果。字数控制在280-300字。"},
			{Title: "正文结构", Content: "项目概述(300字) -> 架构设计过程(1500字，核心) -> 效果评估(200字)。重点写自己的实践和思考。"},
			{Title: "常见问题", Content: "偏题、字数不足、缺乏实践经验、只讲理论不讲应用、摘要和正文不一致。"},
			{Title: "项目背景描述要点", Content: "项目背景需交代项目名称、甲方、项目周期、投资规模、团队规模、技术栈选择理由。用1-2句话交代即可，不要展开技术细节。"},
			{Title: "架构师角色体现", Content: "论文中必须体现你作为架构师的具体工作：需求分析、架构选型决策、技术方案评审、核心模块设计。避免写成项目经理或程序员视角。"},
		},
	},
}
