---
name: video-transcript
description: YouTube 動画の字幕を取得して全文テキストで返す。実践者本人の解説動画・カンファレンストークを一次資料として読むために使う。
argument-hint: <youtube-url-or-id>
---

# video-transcript

YouTube 動画の字幕を取得し、タイムスタンプを落とした全文テキストにして返す。

## なぜ必要か

`WebFetch` で YouTube を開くとボット判定で弾かれ、中身が取れない。二次記事（まとめ記事、解説動画）で代替すると、本人が言っていないことを本人の主張として書いてしまう。長い動画を一次資料として扱うには字幕の全文が要る。

## 前提

`yt-dlp` が必要。無ければ `pip install yt-dlp` で入れる。

## 手順

```bash
yt-dlp --skip-download --ignore-no-formats-error \
  --write-auto-subs --write-subs --sub-langs "en.*,ja.*" --sub-format vtt \
  --extractor-args "youtube:player_client=web_embedded" \
  --print-to-file "%(title)s|%(upload_date)s|%(duration)s|%(channel)s" out.meta \
  -o "out.%(ext)s" "<URL>"
```

取得した `.vtt` から、タイムスタンプ行・`WEBVTT` などのヘッダ行・重複行を落として 1 本のテキストにする。自動字幕は同じ行が繰り返し出るので、直前の行と同一なら捨てる。

## 注意

- `player_client=web_embedded` が要る。既定のクライアントは "Sign in to confirm you're not a bot" で弾かれる。`ios`、`android`、`tv_simply` も同様に弾かれる
- `--ignore-no-formats-error` が要る。`web_embedded` は字幕は取れるが動画フォーマットを返さないため、これが無いと字幕を書き出した後に `No video formats found` で落ちる
- 途中に出る `HTTP Error 429` と impersonation の警告は字幕取得には影響しない
- `--print-to-file` のメタ情報（タイトル、投稿日、尺、チャンネル）を必ず確認する。**検索結果のタイトルと実際の動画が食い違うことがある**。特に、本人の talk を検索したつもりが解説チャンネルの二次動画だったというケースがある。チャンネル名が本人・公式・カンファレンス主催のものかを見る
- タイトルは公開後に差し替えられることがある。数時間で変わった例がある。出典に書くときは、書く直前に取得したメタ情報のタイトルを使う
- 自動字幕なので固有名詞は崩れる（`Claude` が `quad` / `clocko`、`Bun` が `bond` など）。引用するときは文脈から復元し、崩れたまま書かない
- 字幕が存在しない動画は取得できない。その場合はその素材を扱わない
