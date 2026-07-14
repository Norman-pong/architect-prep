package seed

// QuestionSeed 题目种子数据
type QuestionSeed struct {
	ChapterID   int      `json:"chapter_id"`
	ExamType    string   `json:"exam_type"`     // comprehensive / case / essay
	QuestionType string  `json:"question_type"` // single / multiple
	Content     string   `json:"content"`
	Options     []string `json:"options"`
	AnswerKeys  []string `json:"answer_keys"`
	Explanation string   `json:"explanation"`
	Source      string   `json:"source"`
	Difficulty  int      `json:"difficulty"`
}

// Questions 种子题目数据（按章节组织，覆盖高频考点）
var Questions = []QuestionSeed{
	// 第1章 绪论
	{
		ChapterID: 1, ExamType: "comprehensive", QuestionType: "single",
		Content: "系统架构是系统的一种整体的（ ）的结构表示。",
		Options: []string{"A. 低层次", "B. 高层次", "C. 中层次", "D. 基础层次"},
		AnswerKeys: []string{"B"},
		Explanation: "系统架构是系统的一种整体的高层次的结构表示，是系统的骨架和根基。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 1, ExamType: "comprehensive", QuestionType: "single",
		Content: "软件架构概念的形成始于20世纪（）年代。",
		Options: []string{"A. 60", "B. 70", "C. 80", "D. 90"},
		AnswerKeys: []string{"D"},
		Explanation: "20世纪90年代，研究人员展开了对软件架构的基础研究，主要集中于架构风格、架构描述语言等。",
		Source: "seed", Difficulty: 2,
	},
	// 第2章 计算机系统
	{
		ChapterID: 2, ExamType: "comprehensive", QuestionType: "single",
		Content: "冯·诺伊曼结构计算机由五部分组成，不包括（）。",
		Options: []string{"A. 运算器", "B. 控制器", "C. 总线", "D. 输入设备"},
		AnswerKeys: []string{"C"},
		Explanation: "冯·诺伊曼结构由运算器、控制器、存储器、输入设备和输出设备五部分组成，总线不属于这五部分。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 2, ExamType: "comprehensive", QuestionType: "single",
		Content: "以下关于嵌入式系统的叙述中，错误的是（）。",
		Options: []string{"A. 专用性强", "B. 实时性要求高", "C. 资源不受限", "D. 可靠性要求高"},
		AnswerKeys: []string{"C"},
		Explanation: "嵌入式系统的特点是专用性强、实时性强、可靠性高、资源受限（不是不受限）。",
		Source: "seed", Difficulty: 2,
	},
	// 第4章 信息安全
	{
		ChapterID: 4, ExamType: "comprehensive", QuestionType: "single",
		Content: "信息安全的CIA三要素是指（）。",
		Options: []string{
			"A. 机密性、完整性、可用性",
			"B. 机密性、可控性、可用性",
			"C. 完整性、可控性、真实性",
			"D. 机密性、完整性、可审计性",
		},
		AnswerKeys: []string{"A"},
		Explanation: "CIA三要素：机密性(Confidentiality)、完整性(Integrity)、可用性(Availability)。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 4, ExamType: "comprehensive", QuestionType: "single",
		Content: "RSA加密算法属于（）加密体制。",
		Options: []string{"A. 对称密钥", "B. 非对称密钥", "C. 哈希", "D. 序列密码"},
		AnswerKeys: []string{"B"},
		Explanation: "RSA是非对称密钥加密算法，公钥加密、私钥解密。DES/AES是对称密钥。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 4, ExamType: "comprehensive", QuestionType: "multiple",
		Content: "以下属于访问控制模型的有（）。",
		Options: []string{
			"A. 自主访问控制(DAC)",
			"B. 强制访问控制(MAC)",
			"C. 基于角色的访问控制(RBAC)",
			"D. 基于属性的访问控制(ABAC)",
		},
		AnswerKeys: []string{"A", "B", "C", "D"},
		Explanation: "四种访问控制模型：DAC、MAC、RBAC、ABAC。",
		Source: "seed", Difficulty: 2,
	},
	// 第5章 软件工程
	{
		ChapterID: 5, ExamType: "comprehensive", QuestionType: "single",
		Content: "瀑布模型的特点是（）。",
		Options: []string{
			"A. 迭代开发",
			"B. 线性顺序开发",
			"C. 风险驱动",
			"D. 增量交付",
		},
		AnswerKeys: []string{"B"},
		Explanation: "瀑布模型是线性顺序的开发模型，每个阶段完成后才进入下一阶段。螺旋模型是风险驱动。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 5, ExamType: "comprehensive", QuestionType: "single",
		Content: "CMM（能力成熟度模型）的第五级是（）。",
		Options: []string{"A. 初始级", "B. 可重复级", "C. 已定义级", "D. 优化级"},
		AnswerKeys: []string{"D"},
		Explanation: "CMM五级：初始级、可重复级、已定义级、量化管理级、优化级(持续改进)。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 5, ExamType: "comprehensive", QuestionType: "multiple",
		Content: "敏捷开发方法包括（）。",
		Options: []string{"A. Scrum", "B. XP", "C. Kanban", "D. 瀑布模型"},
		AnswerKeys: []string{"A", "B", "C"},
		Explanation: "Scrum、XP(极限编程)、Kanban都是敏捷方法。瀑布模型是传统瀑布式开发。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 5, ExamType: "comprehensive", QuestionType: "single",
		Content: "软件测试中，路径覆盖属于（）。",
		Options: []string{"A. 黑盒测试", "B. 白盒测试", "C. 灰盒测试", "D. 集成测试"},
		AnswerKeys: []string{"B"},
		Explanation: "路径覆盖是白盒测试方法，要求覆盖程序中所有可能的执行路径。",
		Source: "seed", Difficulty: 2,
	},
	// 第6章 数据库
	{
		ChapterID: 6, ExamType: "comprehensive", QuestionType: "single",
		Content: "数据库三级模式中，描述全局逻辑结构的是（）。",
		Options: []string{"A. 外模式", "B. 概念模式", "C. 内模式", "D. 存储模式"},
		AnswerKeys: []string{"B"},
		Explanation: "概念模式(Conceptual Schema)描述数据库的全局逻辑结构。外模式是用户视图，内模式是物理存储。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 6, ExamType: "comprehensive", QuestionType: "single",
		Content: "消除非主属性对码的部分函数依赖，可以达到（）。",
		Options: []string{"A. 1NF", "B. 2NF", "C. 3NF", "D. BCNF"},
		AnswerKeys: []string{"B"},
		Explanation: "2NF消除非主属性对码的部分函数依赖。3NF消除传递依赖。BCNF要求主属性也不依赖于不包含它的码。",
		Source: "seed", Difficulty: 3,
	},
	{
		ChapterID: 6, ExamType: "comprehensive", QuestionType: "single",
		Content: "以下属于NoSQL数据库的是（）。",
		Options: []string{
			"A. MySQL",
			"B. PostgreSQL",
			"C. MongoDB",
			"D. Oracle",
		},
		AnswerKeys: []string{"C"},
		Explanation: "MongoDB是文档型NoSQL数据库。MySQL/PostgreSQL/Oracle是关系型数据库。",
		Source: "seed", Difficulty: 1,
	},
	// 第7章 系统架构设计
	{
		ChapterID: 7, ExamType: "comprehensive", QuestionType: "single",
		Content: "管道-过滤器架构属于（）架构风格。",
		Options: []string{"A. 数据流", "B. 调用返回", "C. 独立构件", "D. 虚拟机"},
		AnswerKeys: []string{"A"},
		Explanation: "管道-过滤器是数据流风格的典型代表，数据在过滤器间单向流动。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 7, ExamType: "comprehensive", QuestionType: "single",
		Content: "基于架构的软件开发方法(ABSD)的核心是（）。",
		Options: []string{
			"A. 需求驱动",
			"B. 架构驱动",
			"C. 测试驱动",
			"D. 数据驱动",
		},
		AnswerKeys: []string{"B"},
		Explanation: "ABSD是以架构为核心驱动开发过程，包括架构需求、设计、文档化、复审、实现、演化。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 7, ExamType: "comprehensive", QuestionType: "multiple",
		Content: "以下属于调用返回风格的架构有（）。",
		Options: []string{
			"A. 主程序-子程序",
			"B. 面向对象",
			"C. 层次结构",
			"D. 管道-过滤器",
		},
		AnswerKeys: []string{"A", "B", "C"},
		Explanation: "调用返回风格包括主程序-子程序、面向对象、层次结构。管道-过滤器属于数据流风格。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 7, ExamType: "comprehensive", QuestionType: "single",
		Content: "DSSA（特定领域软件架构）的三个基本活动是（）。",
		Options: []string{
			"A. 需求分析、系统设计、系统实现",
			"B. 领域分析、领域设计、领域实现",
			"C. 架构设计、架构评估、架构演化",
			"D. 架构需求、架构设计、架构文档化",
		},
		AnswerKeys: []string{"B"},
		Explanation: "DSSA包含领域分析、领域设计、领域实现三个基本活动。",
		Source: "seed", Difficulty: 3,
	},
	// 第8章 质量属性与架构评估
	{
		ChapterID: 8, ExamType: "comprehensive", QuestionType: "single",
		Content: "ATAM方法的含义是（）。",
		Options: []string{
			"A. 软件架构分析法",
			"B. 架构权衡分析法",
			"C. 架构评审法",
			"D. 架构度量法",
		},
		AnswerKeys: []string{"B"},
		Explanation: "ATAM(Architecture Tradeoff Analysis Method)是架构权衡分析法，识别风险点、敏感点、权衡点。SAAM是软件架构分析法。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 8, ExamType: "comprehensive", QuestionType: "single",
		Content: "质量属性场景由（）部分组成。",
		Options: []string{"A. 4", "B. 5", "C. 6", "D. 7"},
		AnswerKeys: []string{"C"},
		Explanation: "质量属性场景由6部分组成：刺激源、刺激、制品、环境、响应、响应度量。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 8, ExamType: "comprehensive", QuestionType: "multiple",
		Content: "以下属于软件质量属性的有（）。",
		Options: []string{
			"A. 可用性",
			"B. 性能",
			"C. 安全性",
			"D. 可修改性",
		},
		AnswerKeys: []string{"A", "B", "C", "D"},
		Explanation: "质量属性六要素：可用性、可靠性、性能、安全性、可修改性、可测试性。",
		Source: "seed", Difficulty: 1,
	},
	// 第9章 软件可靠性
	{
		ChapterID: 9, ExamType: "comprehensive", QuestionType: "single",
		Content: "MTBF的含义是（）。",
		Options: []string{
			"A. 平均故障时间",
			"B. 平均故障间隔时间",
			"C. 平均修复时间",
			"D. 平均无故障时间",
		},
		AnswerKeys: []string{"B"},
		Explanation: "MTBF(Mean Time Between Failures)是平均故障间隔时间。MTTF是平均无故障时间。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 9, ExamType: "comprehensive", QuestionType: "single",
		Content: "N版本编程属于（）容错技术。",
		Options: []string{
			"A. 主动冗余",
			"B. 被动冗余",
			"C. N版本冗余",
			"D. 恢复块",
		},
		AnswerKeys: []string{"C"},
		Explanation: "N版本冗余是多个独立版本并行执行，通过表决确定结果。恢复块是后备版本方式。",
		Source: "seed", Difficulty: 3,
	},
	// 第10章 架构演化
	{
		ChapterID: 10, ExamType: "comprehensive", QuestionType: "single",
		Content: "大型网站架构演化的正确顺序是（）。",
		Options: []string{
			"A. 单体->分布式->缓存->CDN",
			"B. 单体->垂直拆分->缓存->分布式服务",
			"C. 缓存->单体->分布式->微服务",
			"D. 分布式->单体->缓存->CDN",
		},
		AnswerKeys: []string{"B"},
		Explanation: "演化顺序：单体->垂直拆分->缓存->读写分离->反向代理CDN->分布式文件系统->NoSQL->搜索引擎->业务拆分->分布式服务。",
		Source: "seed", Difficulty: 2,
	},
	// 第13章 层次式架构
	{
		ChapterID: 13, ExamType: "comprehensive", QuestionType: "single",
		Content: "MVC模式中，Model代表（）。",
		Options: []string{"A. 视图", "B. 模型", "C. 控制器", "D. 模板"},
		AnswerKeys: []string{"B"},
		Explanation: "MVC：Model(模型/数据)、View(视图/展示)、Controller(控制器/逻辑)。",
		Source: "seed", Difficulty: 1,
	},
	{
		ChapterID: 13, ExamType: "comprehensive", QuestionType: "single",
		Content: "三层架构不包含（）。",
		Options: []string{
			"A. 表现层",
			"B. 业务逻辑层",
			"C. 数据访问层",
			"D. 网络层",
		},
		AnswerKeys: []string{"D"},
		Explanation: "三层架构：表现层、业务逻辑层(中间层)、数据访问层。网络层不属于三层架构。",
		Source: "seed", Difficulty: 1,
	},
	// 第14章 云原生
	{
		ChapterID: 14, ExamType: "comprehensive", QuestionType: "single",
		Content: "以下不属于云原生核心技术的是（）。",
		Options: []string{"A. 容器", "B. 微服务", "C. 虚拟机", "D. 服务网格"},
		AnswerKeys: []string{"C"},
		Explanation: "云原生核心技术：容器、微服务、无服务器(Serverless)、服务网格(Service Mesh)。虚拟机不是云原生技术。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 14, ExamType: "comprehensive", QuestionType: "single",
		Content: "Kubernetes的主要作用是（）。",
		Options: []string{
			"A. 容器化应用",
			"B. 容器编排",
			"C. 镜像构建",
			"D. 持续集成",
		},
		AnswerKeys: []string{"B"},
		Explanation: "Kubernetes(K8s)是容器编排平台，负责容器的部署、扩缩容和管理。Docker负责容器化。",
		Source: "seed", Difficulty: 1,
	},
	// 第15章 SOA
	{
		ChapterID: 15, ExamType: "comprehensive", QuestionType: "single",
		Content: "SOA与微服务的主要区别是（）。",
		Options: []string{
			"A. SOA使用ESB，微服务去中心化",
			"B. SOA是分布式的，微服务不是",
			"C. 微服务用ESB，SOA去中心化",
			"D. 没有区别",
		},
		AnswerKeys: []string{"A"},
		Explanation: "SOA强调企业级集成，使用ESB(企业服务总线)；微服务强调独立部署，去中心化，每个服务有自己的数据库。",
		Source: "seed", Difficulty: 2,
	},
	// 第18章 安全架构
	{
		ChapterID: 18, ExamType: "comprehensive", QuestionType: "single",
		Content: "Bell-LaPadula模型的核心原则是（）。",
		Options: []string{
			"A. 不上读不下写",
			"B. 不下读不上写",
			"C. 读后写",
			"D. 写后读",
		},
		AnswerKeys: []string{"A"},
		Explanation: "Bell-LaPadula是机密性模型，核心原则是\"不上读不下写\"(No Read Up, No Write Down)。Biba是完整性模型，\"不下读不上写\"。",
		Source: "seed", Difficulty: 3,
	},
	{
		ChapterID: 18, ExamType: "comprehensive", QuestionType: "single",
		Content: "WPDRRC模型中不包括（）。",
		Options: []string{"A. 预警", "B. 保护", "C. 检测", "D. 加密"},
		AnswerKeys: []string{"D"},
		Explanation: "WPDRRC：预警(Warning)、保护(Protect)、检测(Detect)、响应(React)、恢复(Restore)、反击(Counter)。加密不属于WPDRRC。",
		Source: "seed", Difficulty: 2,
	},
	// 第19章 大数据
	{
		ChapterID: 19, ExamType: "comprehensive", QuestionType: "single",
		Content: "Lambda架构包含（）层。",
		Options: []string{"A. 2", "B. 3", "C. 4", "D. 5"},
		AnswerKeys: []string{"B"},
		Explanation: "Lambda架构三层：批处理层(Batch)、速度层(Speed)、服务层(Serving)。",
		Source: "seed", Difficulty: 2,
	},
	{
		ChapterID: 19, ExamType: "comprehensive", QuestionType: "single",
		Content: "Kappa架构相比Lambda架构的优势是（）。",
		Options: []string{
			"A. 计算更精确",
			"B. 只需维护一套流处理代码",
			"C. 支持更大数据量",
			"D. 延迟更低",
		},
		AnswerKeys: []string{"B"},
		Explanation: "Kappa简化Lambda，只保留流处理层，用Kafka作为唯一数据源，只需维护一套代码。但流式计算精度可能不如批处理。",
		Source: "seed", Difficulty: 3,
	},
	{
		ChapterID: 19, ExamType: "comprehensive", QuestionType: "multiple",
		Content: "大数据的5V特征包括（）。",
		Options: []string{
			"A. Volume(大量)",
			"B. Velocity(高速)",
			"C. Variety(多样)",
			"D. Value(价值)",
		},
		AnswerKeys: []string{"A", "B", "C", "D"},
		Explanation: "5V：Volume(大量)、Velocity(高速)、Variety(多样)、Value(低价值密度)、Veracity(真实性)。",
		Source: "seed", Difficulty: 1,
	},
}
