-- Mini seed data for testing search functionality
INSERT INTO "Place"(id, name, address, geohash6, location, popularity, category, "createdAt", "updatedAt")
VALUES
  ('p1', '카페 알파', '서울 중구 명동', 'wydm6v', ST_GeogFromText('POINT(126.9780 37.5665)'), 0.90, '카페', now(), now()),
  ('p2', '레스토랑 베타', '서울 용산구', 'wydm6w', ST_GeogFromText('POINT(126.9800 37.5650)'), 0.85, '레스토랑', now(), now()),
  ('p3', '피트니스 감마', '서울 종로구', 'wydm6u', ST_GeogFromText('POINT(126.9760 37.5675)'), 0.82, '운동', now(), now()),
  ('p4', '살롱 델타', '서울 마포구', 'wydm6t', ST_GeogFromText('POINT(126.9700 37.5680)'), 0.80, '미용', now(), now()),
  ('p5', '리테일 엡실론', '서울 서대문구', 'wydm6x', ST_GeogFromText('POINT(126.9820 37.5640)'), 0.78, '쇼핑', now(), now()),
  ('p6', '카페 라떼', '서울 강남구', 'wydm7a', ST_GeogFromText('POINT(127.0276 37.4979)'), 0.88, '카페', now(), now()),
  ('p7', '스시 오마카세', '서울 송파구', 'wydm7b', ST_GeogFromText('POINT(127.1058 37.5145)'), 0.92, '레스토랑', now(), now()),
  ('p8', '북카페 독서당', '서울 성동구', 'wydm7c', ST_GeogFromText('POINT(127.0369 37.5633)'), 0.75, '카페', now(), now()),
  ('p9', '헬스장 파워짐', '서울 노원구', 'wydm7d', ST_GeogFromText('POINT(127.0562 37.6542)'), 0.70, '운동', now(), now()),
  ('p10', '베이커리 크루아상', '서울 동대문구', 'wydm7e', ST_GeogFromText('POINT(127.0409 37.5743)'), 0.83, '베이커리', now(), now())
ON CONFLICT (id) DO NOTHING;