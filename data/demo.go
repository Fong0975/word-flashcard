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
			"# Note <br/> ## This is a note <br/>- Details.",
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
			"{\"us\": \"https://dictionary.cambridge.org/zht/media/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/us_pron/c/cor/corn_/corn.mp3\"}",
			"",
			"",
		}, {
			5,
			"noun",
			"部分;部件;要素 A part of something",
			"",
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
