# 紙と道 行政書士事務所 — 調査・情報設計の記録

確認日：2026年9月26日。架空の事務所を使った國分Web製作所の制作デモです。既存サイトの業務紹介を転載せず、業務の事実を確認したうえで、相談者の疑問に沿って独自に構成・執筆しました。写真は従来の生成画像3点を継続使用し、建設業の章に合う写真1点を新たに生成しました。組み込みの画像生成ツールを使用し、配信用画像は `images/construction.webp`、最終プロンプトと生成元ファイル・寸法・ハッシュは [sources.json](sources.json) に保存しています。

## 相談者が判断する順に並べる

冒頭で「家族の手続き」と「建設業の仕事」に分岐し、同じ1ページ内の該当箇所へ移動します。各章は「いまの困りごと → 依頼できる作業 → 整理・作成するもの → 対応範囲や期日 → 最初に伝えること」の順です。共通する依頼の流れと費用は一度だけ掲載しました。

業務名を羅列する代わりに、「受け継ぐ人を確かめる」「決まった分け方を書類にする」のように目的を見出しにしています。専門用語は残し、各章の初出付近に、短い説明を常時表示します。本文と注釈を離さず、ホバー操作や用語集への移動を必要としない設計です。

## 設計の根拠と適用

| 根拠 | このページへの適用 |
| --- | --- |
| [GOV.UK：ユーザーの必要から始めるコンテンツ設計](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-content-design/) | 書類名を知っている前提にせず、生活・仕事上の状況から探せる入口にする。 |
| [GOV.UK：明確な言葉を使う](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/) | 短い文、具体的な動作、担当する人が分かる説明を使う。 |
| [W3C WAI COGA：Use Clear Words](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p01-clear-words/) | 遺産分割協議書・許可要件・決算変更届などに、読む場所で分かる注釈を付ける。 |
| [W3C COGA：短いまとまりで示す](https://www.w3.org/TR/coga-usable/#use-short-chunks-of-text-pattern) | 業務を目的別の短い行に分け、見出しと作業後に得られるものを同じ順序で示す。 |
| [Chandler & Sweller（1992）：The split-attention effect as a factor in the design of instruction](https://bpspsychub.onlinelibrary.wiley.com/doi/abs/10.1111/j.2044-8279.1992.tb01017.x) | 関連する本文と用語説明を近接させ、離れた説明を覚えて照合する負担を抑える、という設計仮説に用いる。 |
| [GOV.UK Design System：Details](https://design-system.service.gov.uk/components/details/) | 対応範囲・費用・重要な期限は隠さず、FAQと確認資料の詳細だけを開閉式にする。 |

COGAは補足ガイダンスであり、それだけでWCAGへの適合を証明するものではありません。認知科学の研究は教材を対象としたもので、このサイトでの理解率・問い合わせ率の改善を測定したわけではありません。日本語の相談者によるユーザビリティ検証は今後の課題です。

## 業務と制度の確認先

| 確認したこと | 一次資料 |
| --- | --- |
| 相続に関する調査・書類作成、紛争・税務・登記申請との業務範囲の区別 | [日本行政書士会連合会：遺言・相続](https://www.gyosei.or.jp/service/testament) |
| 戸籍等の収集、相続関係の整理、遺言作成の支援 | [福島県行政書士会：遺言・相続](https://fukushima-gyosei.jp/about01/yuigon/) |
| 財産調査の対象に負債も含むこと | [日本行政書士会連合会：行政書士活用ガイド](https://www.gyosei.or.jp/sites/default/files/1699494803/%E8%A1%8C%E6%94%BF%E6%9B%B8%E5%A3%AB%E6%B4%BB%E7%94%A8%E3%82%AC%E3%82%A4%E3%83%89.pdf) |
| 建設業許可の申請書類作成・代理申請、取得後の届出 | [日本行政書士会連合会：建設業・宅地建物取引業](https://www.gyosei.or.jp/service/construction) |
| 工事別の許可、軽微な工事の例外、有効期間5年・更新申請は満了30日前まで | [国土交通省：建設業の許可とは](https://www.mlit.go.jp/totikensangyo/const/1_6_bt_000080.html) |
| 経営の経験、技術者、資金、保険など、許可取得に必要な条件 | [国土交通省：許可の要件](https://www.mlit.go.jp/totikensangyo/const/1_6_bt_000082.html) |
| 「営業所技術者等」の現行表記 | [東京都：令和8年度 建設業許可の手引と申請書類](https://www.toshiseibi.metro.tokyo.lg.jp/kenchiku_kaihatsu/kenchiku_shidou/gyosya_shido/kensetsu/kensetsu_kyoka_tebiki3) |
| 毎年の届出は事業年度終了後4か月以内、変更内容により期限が異なること | [栃木県：許可に際する注意事項・変更届出等](https://www.pref.tochigi.lg.jp/h01/work/kensetsugyou/kyoka/1281925868251.html) / [愛知県：許可後の届出](https://www.pref.aichi.jp/site/kensetsugyo-fudosangyo/todokede.html) |
| 相続放棄は期限のある家庭裁判所の手続きであること | [裁判所：相続の放棄の申述](https://www.courts.go.jp/saiban/syurui/syurui_kazi/kazi_06_13/index.html) |

更新期限と毎年の報告期限は取り違えやすいため、業務一覧と別に並べて表示しています。変更届の期限は一律にしません。工事金額だけの許可診断、許可取得の保証、提携先の捏造、架空の料金・実績は掲載していません。

## 更新時の確認

法令・申請先の運用が変わったときは、本文と注釈、期限欄、確認日を一緒に更新します。専門用語を追加した場合は、その章へ直接来た人にも説明が読めるか確認します。元の1ページ構成・生成写真・制作相談へのリンクを維持しています。
