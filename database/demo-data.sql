-- Multitional Translator — deterministic demo dataset
-- Source: sanitized POI content from Neon production branch "production".
-- Account identifiers/passwords, session tokens, QR tokens and grants are synthetic.
-- Never import this file into production.
-- Password for both demo accounts: MT-Demo-2026!Admin (BCrypt, cost 12).
-- QR/grant plaintext tokens are documented in database/README.md; only SHA-256 hashes are stored.

BEGIN;
SET search_path TO public;

INSERT INTO account (id, username, password_hash, display_name, role, enabled, created_at, updated_at)
VALUES
    (1, 'superadmin', '$2a$12$lqV4D2NR1/cbPqAZ/kpAO.48QaT5IIYnoGibcjqRmsljIph4MZcAi', 'Demo Super Admin', 'SUPER_ADMIN', TRUE, now(), now()),
    (2, 'admin',      '$2a$12$lqV4D2NR1/cbPqAZ/kpAO.48QaT5IIYnoGibcjqRmsljIph4MZcAi', 'Demo Admin',       'ADMIN',       TRUE, now(), now());

INSERT INTO language (code, name, native_name, tts_language_code, default_tts_voice, enabled, sort_order)
VALUES
    ('vi', 'Vietnamese', 'Tiếng Việt', 'vi-VN', NULL, TRUE, 1),
    ('en', 'English', 'English', 'en-US', NULL, TRUE, 2);

INSERT INTO poi (id, code, default_name, latitude, longitude, cover_image_key, cover_image_type, status, is_demo, published_at, category, trigger_radius)
VALUES
    (1, 'CUCHI_BEN_DUOC_TUNNELS', 'Địa đạo Bến Dược', 11.14325, 106.46321, 'images/demo-placeholder.png', 'image/png', 'PUBLISHED', TRUE, now(), 'HISTORICAL_SITE', 50.0),
    (2, 'CUCHI_BEN_DUOC_MEMORIAL', 'Đền tưởng niệm Bến Dược', 11.1464, 106.45939, NULL, NULL, 'DRAFT', TRUE, NULL, 'MEMORIAL', 50.0),
    (3, 'CUCHI_BEN_DUOC_WEAPONS', 'Khu trưng bày vũ khí', 11.143, 106.46287, NULL, NULL, 'DRAFT', TRUE, NULL, 'EXHIBITION', 50.0),
    (4, 'CUCHI_BEN_DUOC_AMMO', 'Khu trưng bày đạn dược', 11.14327, 106.46278, NULL, NULL, 'DRAFT', TRUE, NULL, 'EXHIBITION', 50.0),
    (5, 'CUCHI_BEN_DUOC_LIBERATION', 'Khu tái hiện vùng giải phóng', 11.13993, 106.46226, NULL, NULL, 'DRAFT', TRUE, NULL, 'HISTORICAL_RECONSTRUCTION', 50.0),
    (6, 'CUCHI_BEN_DUOC_B52_CRATER', 'Hố bom B-52', 11.14418, 106.46341, NULL, NULL, 'DRAFT', TRUE, NULL, 'HISTORICAL_REMAINS', 50.0),
    (7, 'CUCHI_BEN_DINH_TUNNELS', 'Địa đạo Bến Đình', 11.06056, 106.52753, NULL, NULL, 'DRAFT', TRUE, NULL, 'HISTORICAL_SITE', 50.0),
    (8, 'CUCHI_BEN_DINH_UNIFORM_HOUSE', 'Nhà may quân trang Bến Đình', 11.0604, 106.52809, NULL, NULL, 'DRAFT', TRUE, NULL, 'HISTORICAL_REMAINS', 50.0);

INSERT INTO poi_translation (id, poi_id, language_code, name, description, narration_text, content_version)
VALUES
(1, 1, 'vi', 'Địa đạo Bến Dược',
 'Khu di tích thuộc căn cứ Khu ủy và Bộ Tư lệnh Quân khu Sài Gòn – Chợ Lớn – Gia Định. Tọa độ đánh dấu điểm tham quan tổng thể theo dữ liệu bản đồ; vị trí các hầm ngầm riêng lẻ cần được xác minh tại hiện trường.',
 'Chào mừng quý khách đến với Địa đạo Bến Dược. Xin hãy dành một chút thời gian quan sát không gian xung quanh và hình dung cuộc sống dưới lòng đất trong những năm tháng chiến tranh. Hệ thống địa đạo Củ Chi được hình thành và mở rộng qua nhiều giai đoạn, trở thành nơi đi lại, trú ẩn, liên lạc và tổ chức hoạt động của lực lượng cách mạng. Các đường hầm kết nối với những công trình phục vụ sinh hoạt và công tác, cho thấy sự thích nghi trong điều kiện thiếu thốn và luôn đối mặt với nguy hiểm. Bến Dược gắn với căn cứ của Khu ủy và Bộ Tư lệnh Quân khu Sài Gòn – Chợ Lớn – Gia Định. Những gì quý khách nhìn thấy hôm nay là một di tích được bảo tồn để kể lại lịch sử, không phải toàn bộ mạng lưới hầm đều mở cửa tham quan. Xin đi theo lối được chỉ dẫn, chú ý trần thấp và không tự ý rời tuyến tham quan. Mong rằng chuyến đi giúp quý khách hiểu rõ hơn về con người, hoàn cảnh và những mất mát của một thời chiến tranh.',
 2),
(2, 1, 'en', 'Ben Duoc Tunnels',
 'A historic site associated with the regional Party Committee and the Saigon–Cho Lon–Gia Dinh Military Command. This coordinate marks the overall visitor site from map data; individual underground chambers require on-site verification.',
 'Welcome to Ben Duoc Tunnels. Take a moment to look around and imagine what life underground was like during the war. The Cu Chi tunnel network developed over several periods and became a place for movement, shelter, communication and organising revolutionary activities. Its passages connected with facilities used for daily life and work, reflecting how people adapted to difficult and dangerous conditions. Ben Duoc is associated with the base of the regional Party Committee and the Saigon–Cho Lon–Gia Dinh Military Command. What you see today is a preserved heritage site intended to help tell that history; not every tunnel section is open to visitors. Please follow the marked route, watch for low ceilings, and do not enter restricted passages. May this visit help you better understand the people, circumstances and losses behind this chapter of history.',
 2),
(3, 2, 'vi', 'Đền tưởng niệm Bến Dược',
 'Công trình tưởng niệm những chiến sĩ và người dân đã hy sinh trong các cuộc kháng chiến tại vùng Sài Gòn – Gia Định. Tọa độ tham chiếu theo dữ liệu bản đồ mở.',
 'Quý khách đang ở khu vực Đền tưởng niệm Bến Dược, nơi tưởng nhớ những người đã hy sinh trong các cuộc kháng chiến tại vùng Sài Gòn – Gia Định. Giữa không gian trang nghiêm này, mỗi tên tuổi và mỗi ký ức đều nhắc chúng ta rằng lịch sử được tạo nên từ cuộc đời của những con người cụ thể: người chiến sĩ, người dân và những gia đình chịu ảnh hưởng của chiến tranh. Công trình tưởng niệm gắn liền với ký ức về căn cứ Bến Dược và lịch sử đấu tranh của vùng Củ Chi. Khi tham quan, xin giữ yên lặng phù hợp, tôn trọng các nghi lễ và làm theo hướng dẫn tại chỗ. Dù mỗi người có cách nhìn riêng về lịch sử, sự tưởng nhớ những người đã mất cũng là dịp để suy ngẫm về giá trị của hòa bình, sự cảm thông và trách nhiệm gìn giữ ký ức cho thế hệ sau. Xin dành một phút lắng lòng trước khi tiếp tục hành trình.',
 2),
(4, 2, 'en', 'Ben Duoc Memorial Temple',
 'A memorial dedicated to soldiers and civilians who died in the struggles in the Sai Gon–Gia Dinh region. Coordinates are referenced from open map data.',
 'You are now at the Ben Duoc Memorial Temple, a place of remembrance for those who died in the struggles in the Sai Gon–Gia Dinh region. In this solemn space, every name and memory reminds us that history is made of individual lives: soldiers, civilians and families whose lives were changed by war. The memorial is closely connected with the memory of the Ben Duoc base and the history of Cu Chi. While visiting, please maintain an appropriate level of quiet, respect any ceremonies and follow local guidance. People may interpret history in different ways, but remembering those who died offers an opportunity to reflect on peace, compassion and our responsibility to preserve memory for future generations. Please take a quiet moment before continuing your visit.',
 2),
(5, 3, 'vi', 'Khu trưng bày vũ khí',
 'Khu trưng bày giới thiệu các hiện vật vũ khí gắn với lịch sử chiến đấu và sinh hoạt của lực lượng tại địa đạo. Tọa độ tham chiếu theo dữ liệu bản đồ mở; hiện vật cụ thể có thể thay đổi theo bố trí trưng bày.',
 'Tại khu trưng bày vũ khí, quý khách có thể tìm hiểu một phần điều kiện chiến đấu trong thời kỳ chiến tranh. Các hiện vật được giới thiệu trong bối cảnh lịch sử của chúng, phản ánh những phương tiện và nguồn lực từng được sử dụng trong cuộc xung đột. Đằng sau mỗi hiện vật là câu chuyện về kỹ thuật, công tác hậu cần, sự thiếu thốn và những rủi ro mà con người phải đối mặt. Khi quan sát, xin đọc phần chú giải tại chỗ để hiểu rõ hơn nguồn gốc và mục đích sử dụng của từng hiện vật; cách bố trí trưng bày có thể thay đổi theo thời gian. Đây không chỉ là câu chuyện về vũ khí, mà còn là dịp suy ngẫm về hậu quả của chiến tranh đối với con người và cộng đồng. Xin không chạm, di chuyển hoặc vượt qua ranh giới bảo vệ hiện vật nếu chưa được cho phép.',
 2),
(6, 3, 'en', 'Weapons Exhibition',
 'This exhibition presents weapons and objects connected with the fighting and daily life of forces based in the tunnel network. The coordinate is referenced from open map data; the specific display may change with exhibition layout.',
 'At the weapons exhibition, visitors can learn about some of the conditions in which people fought during the war. The displayed objects are presented in their historical context and reflect equipment and resources used during the conflict. Behind each object lies a story of technology, logistics, scarcity and the risks people faced. Please read the on-site labels for information about each item''s origin and use; the exhibition layout may change over time. This is not only a story about weapons, but also an opportunity to consider the consequences of war for people and communities. Please do not touch or move exhibits, or cross protective barriers, unless staff explicitly permit it.',
 2),
(7, 4, 'vi', 'Khu trưng bày đạn dược',
 'Điểm trưng bày hiện vật liên quan đến đạn dược và hậu cần quân sự trong khu di tích Bến Dược. Tọa độ tham chiếu theo dữ liệu bản đồ mở.',
 'Khu trưng bày đạn dược giới thiệu một khía cạnh của công tác hậu cần trong chiến tranh. Để duy trì hoạt động trong điều kiện khó khăn, các lực lượng phải tổ chức tiếp tế, bảo quản và sử dụng vật tư trong hoàn cảnh luôn có nhiều rủi ro. Những hiện vật tại đây giúp hình dung phần nào yêu cầu về nguồn cung và sự phức tạp của đời sống quân sự thời chiến. Xin lưu ý rằng thông tin chính xác về từng hiện vật được thể hiện trên bảng chú giải tại khu trưng bày, và cách sắp đặt có thể thay đổi. Vì lý do an toàn và bảo tồn, vui lòng không chạm vào hiện vật, không di chuyển vật trưng bày và luôn tuân theo hướng dẫn của nhân viên. Khi rời khu vực này, quý khách có thể tiếp tục nhìn nhận di tích qua góc độ rộng hơn: không chỉ các trận đánh, mà cả những hoạt động hậu cần và đời sống thường nhật cũng góp phần định hình lịch sử.',
 2),
(8, 4, 'en', 'Ammunition Exhibition',
 'A display point for objects related to ammunition and military logistics at the Ben Duoc site. Coordinates are referenced from open map data.',
 'The ammunition exhibition introduces one aspect of wartime logistics. To sustain operations in difficult conditions, forces had to organise supplies, storage and the use of materials amid constant risks. The objects here help illustrate the demands of supply and the complexity of military life during the war. Please consult the exhibition labels for verified information about individual items; the arrangement may change over time. For safety and conservation, do not touch or move the displays, and follow staff instructions. As you leave, consider the site from a broader perspective: history was shaped not only by battles, but also by logistics and everyday activities.',
 2),
(9, 5, 'vi', 'Khu tái hiện vùng giải phóng',
 'Khu tham quan tái hiện một phần cảnh quan và đời sống trong vùng giải phóng thời chiến. Tọa độ tham chiếu theo dữ liệu bản đồ mở; đây là khu tái hiện phục vụ giáo dục lịch sử, không phải nguyên trạng toàn bộ cảnh quan thời chiến.',
 'Khu tái hiện vùng giải phóng giúp quý khách hình dung một phần cảnh quan và sinh hoạt trong thời chiến. Những mô hình, công trình và cách bố trí tại đây được sử dụng để diễn giải bối cảnh lịch sử cho người tham quan. Chúng giúp gợi mở câu hỏi về nơi ở, việc đi lại, tổ chức cộng đồng và cách con người tìm cách duy trì cuộc sống trong hoàn cảnh bất ổn. Xin lưu ý rằng khu tái hiện là cách trình bày có chọn lọc, không phải bản sao nguyên vẹn của mọi địa điểm hay mọi thời điểm trong lịch sử. Để hiểu chính xác hơn, quý khách nên tham khảo bảng thông tin tại từng khu vực và hỏi nhân viên khi cần làm rõ. Khi quan sát không gian này, hãy nghĩ đến những người dân thường cũng như những người tham gia kháng chiến, bởi chiến tranh tác động đến cả cộng đồng. Mong rằng điểm dừng này giúp lịch sử trở nên gần gũi hơn và khơi gợi sự đồng cảm với những trải nghiệm của các thế hệ trước.',
 2),
(10, 5, 'en', 'Liberated Zone Reconstruction',
 'This visitor area recreates selected aspects of the landscape and daily life in a wartime liberated zone. Coordinates are referenced from open map data; this is an educational reconstruction, not a complete preservation of the original wartime landscape.',
 'The reconstructed liberated zone helps visitors imagine aspects of the landscape and daily life during wartime. Its models, structures and layout are used to interpret the historical setting for visitors. They invite questions about shelter, movement, community organisation and how people tried to sustain everyday life in uncertain conditions. Please remember that this area is a selective interpretation, not an exact replica of every place or period in history. For a more accurate understanding, consult the information panels and ask site staff if you need clarification. As you explore, think about civilians as well as those who took part in the resistance, because war affected entire communities. We hope this stop makes the past feel more tangible and encourages empathy for the experiences of earlier generations.',
 2),
(11, 6, 'vi', 'Hố bom B-52',
 'Dấu tích hố bom được ghi nhận trong khu di tích Bến Dược. Tọa độ tham chiếu theo dữ liệu bản đồ mở; nội dung và ranh giới hiện trạng cần tuân theo biển chỉ dẫn tại chỗ.',
 'Dấu tích hố bom tại khu di tích Bến Dược nhắc chúng ta về sức tàn phá của các cuộc ném bom trong chiến tranh. Một biến đổi trên mặt đất có thể gợi lên những ảnh hưởng sâu rộng đối với nhà cửa, môi trường sống và sinh kế của người dân. Khi quan sát dấu tích này, xin lưu ý rằng hình dạng hiện nay có thể chịu tác động của thời gian, công tác bảo tồn và việc chỉnh trang khu di tích. Các thông tin cụ thể về nguồn gốc và bối cảnh của điểm tham quan cần được đối chiếu với bảng diễn giải chính thức tại chỗ. Vui lòng không bước qua rào chắn, đào bới hoặc làm thay đổi địa hình. Điểm dừng này không chỉ kể về sức mạnh của vũ khí, mà còn gợi nhắc đến những tổn thất mà chiến tranh để lại và tầm quan trọng của việc gìn giữ hòa bình. Xin dành ít phút quan sát trong sự tôn trọng trước khi tiếp tục.',
 2),
(12, 6, 'en', 'B-52 Bomb Crater',
 'A bomb-crater remnant recorded within the Ben Duoc historic site. Coordinates are referenced from open map data; follow the on-site signs for the current boundary and interpretation.',
 'The bomb-crater remnant at Ben Duoc is a reminder of the destructive impact of aerial bombing during the war. A change in the ground can point to wider effects on homes, the environment and people''s livelihoods. Please bear in mind that the feature''s present appearance may have been affected by time, conservation work and site maintenance. Specific details about its origin and historical context should be checked against the official interpretation panel on site. Do not cross barriers, dig or alter the ground. This stop tells a story not only about weapons, but also about the losses caused by war and the importance of preserving peace. Please take a moment to observe respectfully before continuing.',
 2),
(13, 7, 'vi', 'Địa đạo Bến Đình',
 'Khu di tích gắn với căn cứ Huyện ủy Củ Chi, gồm hệ thống địa đạo và các công trình phục vụ chỉ huy, hội họp, trú ẩn và sinh hoạt. Tọa độ tham chiếu theo dữ liệu bản đồ mở cho khu vực di tích.',
 'Chào mừng quý khách đến với khu di tích Địa đạo Bến Đình. Nơi đây gắn với căn cứ của Huyện ủy Củ Chi và hệ thống công trình phục vụ việc chỉ huy, liên lạc, trú ẩn cùng sinh hoạt trong chiến tranh. Mạng lưới địa đạo cho thấy cách con người tận dụng địa hình và tổ chức không gian dưới lòng đất để thích ứng với hoàn cảnh nguy hiểm. Bên cạnh các đoạn hầm, khu căn cứ còn được diễn giải thông qua những dấu tích và công trình liên quan. Tuy nhiên, những gì mở cửa cho khách chỉ là một phần của toàn bộ hệ thống lịch sử. Xin đi theo tuyến tham quan được phép, chú ý lối đi hẹp và trần thấp, đồng thời tuân thủ chỉ dẫn của nhân viên. Khi bước qua không gian này, hãy hình dung không chỉ những hoạt động quân sự, mà cả những khó khăn trong việc ăn ở, giữ liên lạc và duy trì cuộc sống. Di tích giúp chúng ta tiếp cận lịch sử qua không gian cụ thể, đồng thời nhắc nhở về cái giá con người phải trả trong chiến tranh.',
 2),
(14, 7, 'en', 'Ben Dinh Tunnels',
 'A historic site associated with the Cu Chi District Party Committee. Its tunnel network and related structures supported command, meetings, shelter and daily life. Coordinates refer to the general historic-site area from open map data.',
 'Welcome to Ben Dinh Tunnels. This historic site is associated with the Cu Chi District Party Committee and facilities used for command, communication, shelter and daily life during the war. The tunnel network shows how people adapted to dangerous circumstances by making use of the terrain and organising spaces underground. Related remains and structures help interpret the wider base. However, the areas open to visitors represent only part of the full historical network. Please stay on the authorised route, watch for narrow passages and low ceilings, and follow staff instructions. As you move through this space, consider not only military activities but also the challenges of eating, living, staying in contact and maintaining daily routines. The site brings history into focus through a tangible place and reminds us of the human cost of war.',
 2),
(15, 8, 'vi', 'Nhà may quân trang Bến Đình',
 'Hạng mục tái hiện hoặc bảo tồn gắn với việc may, sửa quân trang phục vụ lực lượng trong căn cứ Bến Đình. Tọa độ tham chiếu theo dữ liệu bản đồ mở; cần xem bảng diễn giải tại chỗ để xác định chính xác phần nguyên gốc và phần phục dựng.',
 'Điểm tham quan này gợi mở câu chuyện về việc may và sửa quân trang trong điều kiện chiến tranh. Bên cạnh các hoạt động chiến đấu, việc chuẩn bị quần áo, sửa chữa vật dụng và duy trì những nhu cầu thường ngày cũng là một phần quan trọng của công tác hậu cần. Trong điều kiện thiếu thốn, các hoạt động sản xuất và sửa chữa tại căn cứ giúp đáp ứng nhu cầu thiết yếu của lực lượng. Xin đọc bảng diễn giải tại chỗ để biết rõ hơn phần nào là dấu tích được bảo tồn, phần nào là mô hình phục dựng hoặc minh họa. Không nên suy diễn rằng toàn bộ cấu trúc đang thấy đều còn nguyên trạng từ thời chiến. Khi quan sát, quý khách có thể hình dung nhịp sống phía sau chiến tuyến: những công việc lặp lại, sự khéo léo và nỗ lực phối hợp để duy trì sinh hoạt. Chính những chi tiết đời thường như vậy giúp bức tranh lịch sử đầy đủ hơn, vượt ra ngoài câu chuyện về các trận đánh.',
 2),
(16, 8, 'en', 'Ben Dinh Military Uniform Workshop',
 'A preserved or reconstructed facility associated with making and repairing uniforms for forces based at Ben Dinh. Coordinates are referenced from open map data; on-site interpretation should be used to distinguish original remains from reconstruction.',
 'This stop introduces the work of making and repairing military clothing during wartime. Alongside combat, preparing garments, repairing equipment and meeting everyday needs were important parts of logistics. Under conditions of scarcity, production and repair activities at a base helped supply essential items. Please read the on-site interpretation to learn which features are preserved remains and which are reconstructions or illustrations. It should not be assumed that every part of the structure survives unchanged from the wartime period. As you look around, imagine the routines behind the front lines: repeated tasks, practical skill and cooperation needed to sustain daily life. Such everyday details help make the historical picture more complete, beyond the story of battles alone.',
 2);

-- One placeholder image is stored by the existing DEV-only DemoMediaSeeder.
INSERT INTO poi_image (id, poi_id, storage_key, mime_type, sort_order)
VALUES (1, 1, 'images/demo-placeholder.png', 'image/png', 0);

INSERT INTO access_package (id, code, name, duration_minutes, active)
VALUES (1, 'DEMO_24H', 'Demo access — 24 hours', 1440, TRUE);

-- QR-1 and QR-2 are available to redeem. QR-3 is pre-redeemed to support
-- grant/analytics screens. Raw demo tokens are listed in database/README.md.
INSERT INTO access_qr (id, token_hash, package_id, status, note, issued_by, created_at, redeemed_at)
VALUES
    (1, 'a73bcfdc22b25e7f60e1eb729f4027d23a82793277cd853ea9c45031ecd8aca5', 1, 'ISSUED',   '[DEMO] QR-1 — redeemable', 1, now() - interval '1 day', NULL),
    (2, '9021351d98bad0cb23e61d2ba782fa9bf23d6889203a40cc96bdf5a7c8da919a', 1, 'ISSUED',   '[DEMO] QR-2 — redeemable', 1, now() - interval '1 day', NULL),
    (3, 'bf2c7bcbef3f60b46d5cce62248943e800116dc3828fd86cb2fac7ad4ccc1b05', 1, 'REDEEMED', '[DEMO] QR-3 — already redeemed', 1, now() - interval '2 days', now() - interval '1 day');

INSERT INTO access_grant (id, qr_id, token_hash, device_hash, created_at, expires_at)
VALUES
    (1, 3, '578dd3a5b2ea2e7d190a882a4b64c0da9fae401d59dac55fe2fc2fa343cd4537',
     'b5d23175015368cbe7a2d49e1babc024544f7e8a4bacd818dfc6e6287ed12bf9',
     now() - interval '1 day', now() + interval '23 hours');

INSERT INTO audio_generation_job
    (id, translation_id, content_version, content_hash, language_code, status, attempts, max_attempts,
     next_attempt_at, error_code, error_message, requested_by, created_at, started_at, finished_at, updated_at)
VALUES
    (1, 2, 2, 'b3977daeef525dd54f859809f3afd15fefcd977e347d74b7b925c9386d9aaeaf',
     'en', 'FAILED', 1, 3, now(), 'DEMO_SAMPLE',
     'Demo sample only; no external TTS provider request was sent.',
     2, now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', now() - interval '1 day');

INSERT INTO audit_log (id, occurred_at, actor_id, actor_name, action, resource_type, resource_id, result, detail)
VALUES
    (1, now() - interval '2 days', 1, 'superadmin', 'AUTH_LOGIN', 'ACCOUNT', '1', 'SUCCESS', 'Demo Super Admin signed in.'),
    (2, now() - interval '2 days', 1, 'superadmin', 'QR_ISSUE', 'ACCESS_QR', '1', 'SUCCESS', 'Issued a demo QR access token.'),
    (3, now() - interval '1 day', 1, 'superadmin', 'QR_REDEEM', 'ACCESS_QR', '3', 'SUCCESS', 'Demo QR redeemed and visitor grant created.'),
    (4, now() - interval '12 hours', 2, 'admin', 'POI_UPDATE', 'POI', '1', 'SUCCESS', 'Updated demo POI content.'),
    (5, now() - interval '6 hours', 2, 'admin', 'AUDIO_JOB_RETRY', 'AUDIO_GENERATION_JOB', '1', 'FAILURE', 'Demo-only failed job sample.');

INSERT INTO usage_event (id, event_type, grant_id, poi_id, event_id, occurred_at)
VALUES
    (1, 'session_start', 1, NULL, 'demo-event-0001', now() - interval '1 day'),
    (2, 'poi_view',      1, 1,    'demo-event-0002', now() - interval '23 hours'),
    (3, 'audio_play',    1, 1,    'demo-event-0003', now() - interval '22 hours'),
    (4, 'poi_view',      1, 7,    'demo-event-0004', now() - interval '20 hours'),
    (5, 'audio_play',    1, 7,    'demo-event-0005', now() - interval '19 hours');

-- No production auth sessions or media object keys are copied. The existing
-- DEV-only audio seeder creates valid WAV assets from bundled demo fixtures.
-- Advance identity sequences after inserting deterministic IDs.
SELECT setval(pg_get_serial_sequence('public.account', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM account;
SELECT setval(pg_get_serial_sequence('public.auth_session', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM auth_session;
SELECT setval(pg_get_serial_sequence('public.poi', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM poi;
SELECT setval(pg_get_serial_sequence('public.poi_translation', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM poi_translation;
SELECT setval(pg_get_serial_sequence('public.audio_asset', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM audio_asset;
SELECT setval(pg_get_serial_sequence('public.audio_generation_job', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM audio_generation_job;
SELECT setval(pg_get_serial_sequence('public.poi_image', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM poi_image;
SELECT setval(pg_get_serial_sequence('public.access_package', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM access_package;
SELECT setval(pg_get_serial_sequence('public.access_qr', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM access_qr;
SELECT setval(pg_get_serial_sequence('public.access_grant', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM access_grant;
SELECT setval(pg_get_serial_sequence('public.audit_log', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM audit_log;
SELECT setval(pg_get_serial_sequence('public.usage_event', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM usage_event;

COMMIT;
