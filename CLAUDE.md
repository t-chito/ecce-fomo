# news

Routine が毎日生成するニュースを HTML 化し GitHub Pages で公開する repo。このファイルは、次にこの repo を触る Claude が外部との結合点で踏み外さないための行動指針を記す。コードや `SKILL.md` を読めば分かることは書かない。

## 作業前に必ず

ローカルで作業を始める前に `git pull` する。Routine の発行が毎日 auto-merge で main に入るため、手元の HEAD は本番より古いことが多い。古い状態を base に編集すると、最新の発行分を巻き戻す危険がある。

## 発行は PR + auto-merge を経る（main へ直接 push しない）

Routine 環境の git proxy は main への直接 push を弾く。そのため発行は「`claude/…` ブランチへ push → 発行 PR を作る → `.github/workflows/auto-merge-news.yml` が main へ squash-merge」という経路を取る。この auto-merge の発火条件は **PR タイトルが `[<topic>] … 更新` 形式であること**。この形式を崩すと発行が main に入らず（＝配信も通知も止まる）ので、コミット 1 行目と PR タイトルの `[<topic>] … 更新` は `notify.yml` の sed 契約と合わせて厳守する。

発行 PR 以外（テンプレートやスタイルの変更、リファクタ、新トピック追加などの修正）は auto-merge の対象外。タイトルを `[<topic>] … 更新` にせず PR を切れば、自動マージされずユーザーのレビューを経る。

## 新トピックを追加するとき

repo の編集だけでは完了しない。定期発行は claude.ai/code/routines の Routine 設定（repo 外）に依存する。`<topic>/prompt.md` の作成・ハブ `index.html` への行追加まで終えても、Routine 側に `/news-publish <topic>` の登録がなければ自動発行は始まらない。repo を変更したら「Routine への登録が別途必要」とユーザーに伝えるまでが完了。repo 編集だけで完了報告しない。

PR を出す前に Claude は試し発行し、その出力をユーザーに見せて確認を求める一手を必ず挟む。ユーザーが内容と紙面を読んで `prompt.md` の調整を指示するので、了承を得てから PR に進む。

`<topic>/prompt.md` は `jiji/prompt.md` を雛形にする。Skill のパース規則は緩いので、紙名・補助ラベルの書式を独自に変えると masthead の生成挙動が読めなくなる。

## コミットメッセージを変えるとき

コミットメッセージ 1 行目の `[<topic>] ...` 形式は `notify.yml` と `auto-merge-news.yml` の両方が依存する暗黙の契約。`notify.yml` は先頭の `[...]` を sed で抜いてトピック名にし、通知のクリック先 URL `OWNER.github.io/ecce-fomo/<topic>/` を組み立てる。`auto-merge-news.yml` は PR タイトル（＝この 1 行目）が `[` 始まり・`更新` 終わりであることを発行 PR の判定に使い、同じ sed でクリック先を組む。`[test]` だけは特例で、ハブのトップに飛ばす。メッセージ形式を変えるなら両ワークフローも同時に直す。片方だけ触ると発行か通知が静かに壊れる。

## 通知を変える・テストするとき

Claude 単独では完結しない。通知先トピック名は `NTFY_TOPIC` Secret にあって読めず、購読端末側の操作も要る。トピック名を repo に直書きしない（public repo なので漏れる）。Secret の再設定と端末確認はユーザーに依頼する。

## readlater-weekly の Feedly 連携を触るとき

`readlater-weekly` は `feedly-saved` skill 経由で Feedly の Saved for Later を読み書きする。認証は環境変数 `FEEDLY_REFRESH_TOKEN` 1 個に依存し、これは Routine 環境（claude.ai 側、repo 外）に登録されている。public repo なので token を repo に直書きしない。token はローカルでは `~/.config/feedly/refresh_token` にある。Feedly Pro 契約に紐づく developer token で、有料契約が切れると失効する。アクセストークンと user id は refresh token から毎回導出するので、設定すべきはこの 1 個だけ。

unsave は破壊的操作で、Feedly 側の状態を変える。`news-publish` の発行後処理として push 成功後にだけ走る。ブリーフィングに含めた記事の `entryId` だけを外す設計なので、棚卸し後に新たに保存された記事は消さない。手動で発行する場合もこの「push 成功後・対象記事限定」を守る。

## デプロイ（GitHub Pages）

配信は main ブランチの root から `OWNER.github.io/ecce-fomo/<topic>/`。Pages の有効化・公開ブランチ・パスは repo 設定側（repo 外）にあり、main に push された内容がそのまま公開される。発行分が main に載るのは auto-merge 経由（上記「発行は PR + auto-merge を経る」）。新トピックを `<topic>/index.html` に置けば `/ecce-fomo/<topic>/` で配信される前提は、この root 配信設定に依存している。
