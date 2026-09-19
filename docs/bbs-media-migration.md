# BBS 이미지 이전

BBS 이미지는 `bbs-media` 공개 버킷에 저장하고, 공개 BBS 화면에서는 Supabase Storage CDN URL을 직접 사용한다. BBS 컴포넌트는 Next Image Optimization을 사용하지 않는다.

## 서빙 경로 전환

Storage 이전 때 원본 Fivemanage URL과 Storage URL의 연결을 `bbs_article_media_sources`에 저장한다. 기본값은 Storage URL이며, 긴급하게 원본 URL로 되돌려야 할 때 서버 환경 변수 `BBS_MEDIA_MODE=external`을 설정하면 공개 BBS가 저장된 매핑을 사용해 원본 URL을 반환한다. 환경 변수 변경 후에는 재배포하고 관리자 BBS 캐시 새로고침을 실행한다. `external` 이외의 값은 모두 Storage 모드로 처리한다.

기존에 매핑 저장 기능을 적용하기 전에 이전한 기사에는 기존 백업 manifest를 사용해 매핑을 복구할 수 있다.

```powershell
npm run backfill:bbs-image-mappings -- --dry-run backups/bbs-media-migration-날짜.json
npm run backfill:bbs-image-mappings -- --confirm backups/bbs-media-migration-날짜.json
```

## 기존 기사 이전

먼저 변경 대상만 확인한다.

```powershell
npm run migrate:bbs-images -- --dry-run
```

실제 이전은 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`를 사용한다. 먼저 `049_bbs_article_media_sources.sql` migration을 적용해야 한다.

```powershell
npm run migrate:bbs-images
```

실제 이전을 시작하면 기본적으로 `backups/bbs-media-migration-날짜.json`에 원본 본문·대표 이미지·첨부 이미지 URL을 먼저 저장한다. `--backup-file=`로 백업 경로를 직접 지정할 수도 있다. 백업 파일은 저장소에 커밋되지 않도록 무시된다.

백업만 먼저 만들고 이전을 실행하지 않으려면 다음처럼 실행한다.

```powershell
npm run migrate:bbs-images -- --backup-only --limit=10 --backup-file=backups/bbs-media-first-10.json
```

이전 중 생성된 Storage 경로는 작업 중에도 manifest에 기록된다. 따라서 프로세스가 중간에 종료되어도 이미 생성된 파일과 작업 상태를 확인할 수 있다. 기사별 작업이 실패하면 해당 기사 DB 값과 그 작업에서 생성한 파일을 즉시 원복한다.

일부 기사만 처리할 때는 다음 옵션을 사용할 수 있다.

```powershell
npm run migrate:bbs-images -- --dry-run --limit=10
npm run migrate:bbs-images -- --article-id=<기사 UUID>
```

## 롤백

롤백 전에 먼저 백업 파일에 기록된 대상과 파일 수를 확인한다.

```powershell
npm run rollback:bbs-images -- --dry-run backups/bbs-media-migration-날짜.json

npm run backfill:bbs-image-mappings -- --dry-run backups/bbs-media-pilot.json
npm run backfill:bbs-image-mappings -- --confirm backups/기존백업.json

npm run backfill:bbs-image-mappings -- --dry-run backups/bbs-media-pilot.json
npm run backfill:bbs-image-mappings -- --confirm backups/기존백업.json
```

확인 후 실행하면 manifest에 기록된 작업 대상의 본문·대표 이미지·첨부 URL을 원본으로 복구하고, 해당 이전 작업에서 새로 생성된 Storage 파일만 삭제한다.

```powershell
npm run rollback:bbs-images -- --confirm backups/bbs-media-migration-날짜.json
```

이 기능은 이미지 URL 이전의 롤백용이다. 롤백 후 관리자 BBS 페이지의 캐시 새로고침 버튼을 한 번 실행한다. 백업 파일이 없거나 이전 대상이 아닌 기사까지 이미 수동으로 수정된 경우에는 롤백 전에 해당 변경 내용을 확인한다.

스크립트는 본문 Markdown·HTML, 대표 이미지, 첨부 이미지의 Fivemanage URL을 확인하고, 이미지 원본을 다운로드해 `articles/{articleId}/{sha256}.{extension}` 경로에 업로드한다. 업로드가 완료되면 DB의 URL을 Storage URL로 바꾼다. 실패한 기사는 DB를 변경하지 않고, 해당 작업에서 만든 Storage 파일도 정리한다.

이전 완료 후 관리자 BBS 페이지의 캐시 새로고침 버튼을 한 번 실행한다. 스크립트는 DB와 Storage를 직접 변경하므로 운영 시간대에 실행하고, 먼저 `--dry-run` 결과와 실패 목록을 확인한다.

## 신규 JSON 가져오기

관리자 JSON 가져오기는 저장 과정에서 서버가 Fivemanage 이미지를 `bbs-media`로 복사한 뒤, 본문과 대표 이미지 URL을 치환한다. 기사는 기존처럼 비공개로 저장된다. 원본 다운로드가 실패하면 해당 기사와 부분 업로드 파일을 정리하고 오류로 표시한다.

관리자에서 직접 이미지 URL을 입력하는 경우에는 `bbs-media` Storage URL만 허용한다. 외부 원본은 JSON 가져오기 또는 파일 업로드를 사용한다.

이미지는 업로드 시 `Cache-Control: public, max-age=31536000`으로 저장한다. 파일 경로가 기사 UUID와 SHA-256 해시를 포함하므로 수정된 이미지는 새 경로를 사용하고, 기존 캐시와 충돌하지 않는다.
