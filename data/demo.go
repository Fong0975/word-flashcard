package data

import (
	"log/slog"
	"word-flashcard/data/models"
	"word-flashcard/data/peers"
)

func InsertDemoData() {
	slog.Debug("Start inserting demo data")

	// Initialize the database peer objects
	wordPeer, err := peers.NewWordPeer()
	if err != nil {
		slog.Error("Failed to insert demo data. WordPeer has error.", "error", err)
		return
	}

	wordDefinitionPeer, err := peers.NewWordDefinitionsPeer()
	if err != nil {
		slog.Error("Failed to insert demo data. WordDefinitionsPeer has error.", "error", err)
		return
	}

	// Check if there is any data in the database
	queryWords, err := wordPeer.Select(nil, nil, nil, nil, nil)
	if err != nil {
		slog.Error("Failed to insert demo data. Unable to query the words table.", "error", err)
		return
	} else if len(queryWords) > 0 {
		slog.Info("Skip inserting demo data. Data already exists in the table.", "length of words", len(queryWords))
		return
	}

	// Define demo data
	// - words
	wordData := [...]string{
		"album",
		"breeze",
		"corn",
		"daisy",
		"element",
		"fair",
		"garden",
		"honey",
		"ice",
		"jungle",
		"kitten",
		"lemon",
		"mountain",
		"night",
		"ocean",
		"peach",
		"queen",
		"river",
		"sun",
		"tree",
		"umbrella",
		"violet",
		"water",
		"xylophone",
		"yacht",
		"zebra",
	}
	words := make([]*models.Word, 0, len(wordData))
	for _, data := range wordData {
		words = append(words, &models.Word{
			Word: &data,
		})
	}

	// - word_definitions
	wordDefinitionsData := []struct {
		wordId       int
		partOfSpeech string
		definition   string
		phonetics    string
		example      string
		note         string
	}{
		{
			1,
			"noun",
			"(CD或唱片上的) 音樂專輯 A collection of several pieces of music, made available as a single item on a CD, the internet, etc.",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/uka/ukalb/ukalbin002.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/a/alb/album/album.mp3\",}",
			"[\n\"Have you heard their new album? 你聽過他們的新專輯嗎？\"]",
			"# Note \\n ## This is a note \\n- Details.",
		}, {
			1,
			"none",
			"集郵冊;相冊;影集 A book with plain pages, used for collecting together and protecting stamps, photographs, etc.",
			"",
			"[\n\"A stamp/photograph album 集郵冊／相冊\",\n\"We've put the best wedding photos into an album. 我們已經把婚禮上拍得最好的照片放進了相冊。\"]",
			"",
		}, {
			2,
			"noun",
			"和風，微風 A light and pleasant wind",
			"{\"uk\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukb/ukbre/ukbreak027.mp3\", \"us\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/b/bre/breez/breeze.mp3\"}",
			"[\"A warm/cool breeze 和煦／涼爽的風\", \"She let the gentle breeze cool her face. 她任由清涼的微風吹拂著自己的臉頰。\"]",
			"",
		}, {
			2,
			"verb",
			"飄然而行;輕盈而自信地走 To walk somewhere quickly and confidently, without worry or embarrassment",
			"",
			"",
			"",
		}, {
			2,
			"verb",
			"輕鬆完成；輕鬆贏得 To easily complete or win something",
			"",
			"",
			"",
		}, {
			3,
			"noun",
			"（小麥、玉米、燕麥、大麥等）穀物，穀粒 (The seeds of) plants, such as wheat, maize, oats, and barley, that can be used to produce flour",
			"{\"uk\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukc/ukcor/ukcoran024.mp3\", \"us\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/c/cor/corn_/corn.mp3\"}",
			"",
			"",
		}, {
			4,
			"noun",
			"雛菊 A small flower with white petals and a yellow centre that often grows in grass",
			"{\"uk\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukd/ukdag/ukdagoe013.mp3\", \"us\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/d/dai/daisy/daisy.mp3\"}",
			"",
			"",
		}, {
			5,
			"noun",
			"部分;部件;要素 A part of something",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukd/ukdag/ukdagoe013.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/d/dai/daisy/daisy.mp3\"}",
			"[\"List the elements that make up a perfect dinner party. 列舉出盡善盡美的晚宴所有的構成要素。\", \"The movie had all the elements of a good thriller. 這部電影具備了一部精彩的驚慄片的一切要素。\", \"We weren't even taught the elements of (= basic information about) physics at school. 學校連基本的物理知識都沒有教給我們。\"]",
			"",
		}, {
			5,
			"noun",
			"四大元素 Earth, air, fire, and water from which people in the past believed everything else was made",
			"",
			"",
			"- 舊時人們認爲構成一切事物的土、風、火、水",
		}, {
			6,
			"adjective",
			"合理的；公平的；公正的；平等待人的 Treating someone in a way that is right or reasonable, or treating a group of people equally and not allowing personal opinions to influence your judgment",
			"{\"uk\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukf/ukfag/ukfagge012.mp3\"}",
			"[\"a fair trial 公正的審訊\"]",
			"",
		}, {
			6,
			"noun",
			"市集 A large public event where goods are bought and sold, usually from tables that have been specially arranged for the event, and where there is often entertainment",
			"{\"uk\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukf/ukfag/ukfagge012.mp3\", \"us\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/f/fai/fair_/fair.mp3\"}",
			"[\"I bought a wooden salad bowl at the local craft fair. 我在當地的手工藝品市集上買了個木製沙拉碗。\"]",
			"",
		}, {
			7,
			"noun",
			"花園 A piece of land next to and belonging to a house, where flowers and other plants are grown, and often containing an area of grass",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukg/ukgan/ukganja019.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/g/gar/garde/garden.mp3\"}",
			"[\"garden tools/furniture 園藝工具／花園用傢俱\", \"a garden shed 花園中的棚屋\"]",
			"",
		}, {
			8,
			"noun",
			"蜂蜜 A sweet, sticky, yellow substance made by bees and used as food",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukh/ukhom/ukhomon015.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/h/hon/honey/honey.mp3\"}",
			"[\"clover honey 紅花草蜜\"]",
			"",
		}, {
			9,
			"noun",
			"冰 A solid form of water, used for cooling drinks, etc.",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukh/ukhyp/ukhypot015.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/i/ice/ice__/ice.mp3\"}",
			"[\"The roads were covered in ice. 路面結了冰。\", \"a block of ice 一塊冰\"]",
			"",
		}, {
			10,
			"noun",
			"叢林 An area of land covered with thick, tropical trees and plants",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukj/ukjun/ukjun__006.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/j/jun/jungl/jungle.mp3\"}",
			"[\"a jungle of trees and vines 樹木和藤蔓叢生的叢林\"]",
			"",
		}, {
			11,
			"noun",
			"小貓 A young cat",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukk/ukkit/ukkit__008.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/k/kit/kitte/kitten.mp3\"}",
			"[\"a litter of kittens 一窩小貓\"]",
			"",
		}, {
			12,
			"noun",
			"檸檬 A yellow, oval fruit with a thick skin and sour juice, used in cooking and for making drinks",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukl/uklei/ukleisu005.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/l/lem/lemon/lemon.mp3\"}",
			"[\"a slice of lemon 一片檸檬\"]",
			"",
		}, {
			13,
			"noun",
			"山 A very high area of land, such as a hill or a range of hills, that is higher than a plain",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukm/ukmot/ukmotor019.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/m/mou/mount/mountain.mp3\"}",
			"[\"a mountain of dirty dishes 一大堆髒盤子\"]",
			"",
		}, {
			14,
			"noun",
			"夜晚 The time when it is dark and people sleep",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukk/ukkne/ukkneel012.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/k/kni/knigh/knight.mp3\"}",
			"[\"at night 在夜晚\"]",
			"",
		}, {
			15,
			"noun",
			"海洋 A very large area of sea",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/uko/ukocc/ukoccup008.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/e/eus/eus75/eus75146.mp3\"}",
			"[\"The ship sank in the middle of the ocean. 那艘船在大洋中間沉沒了。\"]",
			"",
		}, {
			16,
			"noun",
			"桃子 A round fruit with soft, sweet flesh, a thin skin, and a large seed in the middle",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukp/ukpay/ukpayro020.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/p/pea/peach/peach.mp3\"}",
			"[\"a peach tree 桃樹\", \"The children were eating peaches. 孩子們正在吃桃子。\"]",
			"",
		}, {
			17,
			"noun",
			"女王;王后 A woman who rules a country because she has been born into a royal family, or a woman who is married to a king",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukq/ukqua/ukquart015.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/q/que/queen/queen.mp3\"}",
			"[\"Queen Elizabeth II 伊麗莎白二世女王\", \"How long has she been queen? 她當了多久的女王了？\"]",
			"",
		}, {
			18,
			"noun",
			"河流 A large natural stream of water that flows across the land and usually into the sea",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukr/ukrip/ukripof024.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/r/riv/river/river.mp3\"}",
			"[\"the River Thames 泰晤士河\", \"The river flows into the sea. 河流流入大海。\"]",
			"",
		}, {
			19,
			"noun",
			"太陽 The large ball of fire in the sky that gives us heat and light during the day",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/uks/uksom/uksomet012.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/s/son/son__/son.mp3\"}",
			"[\"The sun is shining. 太陽在照耀着。\", The sun rises in the east and sets in the west. 太陽從東邊升起，從西邊落下。\"]",
			"",
		}, {
			20,
			"noun",
			"樹 A large plant that has a hard trunk, branches, and leaves",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukt/uktre/uktreac020.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/t/tre/tree_/tree.mp3\"}",
			"[\"a tree-lined street 樹木成行的街道\", \"The children climbed the tree. 孩子們爬上了樹。\"]",
			"",
		}, {
			21,
			"noun",
			"雨傘 A piece of equipment that you hold above your head to keep yourself dry in the rain",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukt/uktre/uktreac020.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/t/tre/tree_/tree.mp3\"}",
			"[\"Don't forget to take your umbrella. 別忘了帶傘。\", \"She opened her umbrella as she stepped outside. 她走出門時打開了傘。\"]",
			"",
		}, {
			22,
			"noun",
			"紫羅蘭 A small plant with purple or blue flowers",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukv/ukvin/ukvineg015.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/e/eus/eus74/eus74860.mp3\"}",
			"[\"a violet plant 紫羅蘭植物\"]",
			"",
		}, {
			23,
			"noun",
			"水 A clear liquid that has no colour, taste, or smell, that falls as rain from the sky and is necessary for life",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukw/ukwas/ukwaspi026.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/w/wat/water/water.mp3\"}",
			"[\"a glass of water 一杯水\", \"My wife is drinking water. 我的妻子正在喝水。\"]",
			"",
		}, {
			24,
			"noun",
			"木琴 A musical instrument that consists of a row of wooden bars of different lengths that you hit with small hammers",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukx/ukxra/ukxray_004.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/x/xyl/xylop/xylophone.mp3\"}",
			"[\"She played the xylophone in the school orchestra. 她在學校的管弦樂隊裡演奏木琴。\"]",
			"",
		}, {
			25,
			"noun",
			"遊艇 A large boat with sails or an engine, used for pleasure trips and racing",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukx/ukxra/ukxray_004.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/x/xyl/xylop/xylophone.mp3\"}",
			"[\"a luxury yacht 豪華遊艇\", \"The school is taking the children on a yacht trip. 學校帶孩子們去遊艇旅行。\"]",
			"",
		}, {
			26,
			"noun",
			"斑馬 A wild animal that looks like a horse and has black and white stripes",
			"{\"uk\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/uk_pron/u/ukz/ukzea/ukzealo003.mp3\",\"us\":\"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/z/zeb/zebra/zebra.mp3\"}",
			"[\"a herd of zebras 一群斑馬\", \"The zebra is a wild animal that looks like a horse and has black and white stripes. 斑馬是一種野生動物，看起來像馬，身上有黑白條紋。\"]",
			"",
		},
	}
	definitions := make([]*models.WordDefinition, 0, len(wordDefinitionsData))
	for _, data := range wordDefinitionsData {
		var demoPhonetics, demoExamples, demoNotes *string
		if data.phonetics != "" {
			demoPhonetics = &data.phonetics
		} else {
			demoPhonetics = nil
		}

		if data.example != "" {
			demoExamples = &data.example
		} else {
			demoExamples = nil
		}

		if data.note != "" {
			demoNotes = &data.note
		} else {
			demoNotes = nil
		}

		definitions = append(definitions, &models.WordDefinition{
			WordId:       &data.wordId,
			PartOfSpeech: &data.partOfSpeech,
			Definition:   &data.definition,
			Phonetics:    demoPhonetics,
			Examples:     demoExamples,
			Notes:        demoNotes,
		})
	}

	// Insert data
	// - words
	for _, word := range words {
		_, err := wordPeer.Insert(word)
		if err != nil {
			slog.Error("Failed to insert demo Word data.", "error", err)
			return
		}
	}

	// - word_definitions
	for _, wordDefinition := range definitions {
		_, err := wordDefinitionPeer.Insert(wordDefinition)
		if err != nil {
			slog.Error("Failed to insert demo WordDefinition data.", "error", err)
			return
		}
	}

	slog.Info("Successfully inserted demo data")
}
