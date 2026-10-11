# Каскадный VPN Россия -> Германия. Версия 3

Инструкция для ИИ-агента (Claude Code, Codex или похожего, с доступом к терминалу) и для человека, который его запускает.
Собрано 11 окт 2026 по живой системе, на которой сейчас работают больше ста устройств. Скрипты взяты с работающих
серверов. Наши адреса, ключи и пароли убраны: вместо них метки вида `<EU_IP>`.

**Что нового в версии 3 (11 окт 2026):**
- Московский сервер теперь в **reg.ru Облако**, а не в FirstVDS. В октябре 2026 до московских адресов FirstVDS у нас резали
  WireGuard: с домашнего Уфанета, с мобильного МТС и даже из дата-центра reg.ru. До reg.ru не режут, проверено на 111 людях.
- Одна дорога без развилок. Убраны прямые подключения к Германии, запасной вход и веб-панель: они нужны редко
  и сбивают с пути. Запасные пути лежат в разделе 3 и включаются только по признаку поломки.
- Закрыт IPv6: российский IPv6-адрес устройства больше не может утечь мимо VPN.
- Аварийный стоп из версии 2 остался: если связь с Германией упала, интернет на устройствах пропадает, а не идёт из России.
- Агент сам открывает нужные страницы и говорит, куда нажать. От человека: зарегистрироваться и оплатить.

---

## Часть 1. Для человека (прочитай сам, 1 минута)

**Что получится.** Свой VPN из двух серверов. Твой телефон или ноутбук подключается к серверу в Москве, тот отправляет
весь трафик по замаскированному туннелю на сервер в Германии, и в интернет ты выходишь с немецкого адреса.
Claude, ChatGPT, YouTube работают. Если связь с Германией оборвётся, интернет через VPN просто пропадёт,
а российский адрес сервисы не увидят.

**Твоя часть: зарегистрироваться и оплатить в двух местах.** Агент сам откроет страницы, скажет, что выбрать и куда нажать,
а потом сам всё поставит, проверит и выдаст файлы для твоих устройств.

**Сколько стоит (цены на 11 окт 2026):**
1. **Москва: reg.ru Облако, тариф Free Tier.** Первые 3 месяца 0 ₽ вместе с адресом. Потом сервер сам переходит
   на обычную оплату, около 700 ₽ в месяц (сервер 513 ₽ + адрес 187 ₽), деньги списываются по часам с облачного счёта.
   Оплата картой или СБП.
2. **Германия: Senko Digital, тариф DE-BUDGET-1 (Франкфурт).** 2,29 € в месяц. Оплата картой или криптой.

**Как запустить.** Создай пустую папку, положи в неё этот файл, открой в этой папке Claude Code или Codex и напиши:
«Прочитай файл Kaskadnyy_VPN_instrukciya_dlya_agenta_v3.md и собери всё по нему, шаг за шагом, проверяя каждый этап.»
Дальше отвечай на его вопросы и пиши «готово», когда сделал то, о чём он просит.

**Три правила:**
- Пароли агенту в чат не пиши никогда. Если он попросит пароль, не давай.
- На время сборки выключи на компьютере другой VPN.
- Один файл VPN = одно устройство. Для телефона и ноутбука агент сделает два разных файла.

**Если агент Кодекс в приложении на Windows:** когда он попросит разрешить выход в сеть, разреши.

---

## Часть 2. Для агента

### 2.1. Правила. Читай внимательно, они важнее всего остального

1. **Иди строго по шагам 1–12 по порядку.** Не пропускай шаги, не меняй порядок, не добавляй своих шагов,
   «улучшений» и «заодно». Всё нужное уже записано здесь вместе с причинами.
2. **Не предлагай человеку вариантов.** Ни в начале, ни в середине, ни в конце: никаких «можно ещё», «есть другой способ»,
   «хотите, я дополнительно…», «рекомендую также». Дорога одна, она описана ниже.
3. **Запасные пути только в разделе 3** («Только если сломалось»). Открывай его, только когда увидел признак,
   записанный там дословно. Если что-то сломалось, а подходящего признака в разделе 3 нет: остановись,
   опиши человеку одной-двумя фразами, что видишь, и спроси, как быть. Не импровизируй.
4. **Человек делает только:** регистрацию, заказ по твоей подсказке, оплату, пишет «готово» и вставляет в чат IP-адрес
   сервера, когда ты попросишь. Всё остальное делаешь ты сам.
5. **Страницы открываешь сам** командой на его компьютере (Mac: `open "URL"`; Windows, Git Bash: `start "" "URL"`;
   Windows PowerShell: `Start-Process "URL"`). Говоришь коротко, по пунктам, названия кнопок в «кавычках», как на экране.
   Одно сообщение = один этап из инструкции (готовый текст для человека дан в шагах дословно). Дальше ждёшь «готово».
6. **Пароли.** Никогда не проси пароль в чат и не вводи пароли сам. Доступ к серверам только по SSH-ключам,
   которые создаёшь ты.
7. **Секреты** (приватные ключи, `params.env`, файлы устройств `.conf`) в чат не выводи. Файлы устройств храни у человека
   в папке проекта `clients/`.
8. **Каждый шаг кончается проверкой** из его блока «Проверка». Нет PASS: дальше не идёшь, смотришь раздел 3.
9. **Теорию не рассказывай,** если человек не спросил. Отчёт после шага: одна строка, «Шаг N готов. Проверено: …».
10. **Метки в угловых скобках** (`<EU_IP>`, `<RU_IP>`, `<RU_E_PUB>`, `<EU>`, `<RU>`) замени на реальные значения до запуска.
    Проверка перед запуском файла на сервере: `grep -n '<[A-Z_]*>' файл` пусто.
11. **Команды на компьютере человека только в bash** (Mac: Терминал; Windows: Git Bash, он ставится вместе с Git).
    Если ты Кодекс на Windows и у тебя PowerShell: каждый локальный блок запиши своим инструментом записи файлов в файл
    `run.sh` в папке проекта (переводы строк LF) и запусти `& "$env:ProgramFiles\Git\bin\bash.exe" run.sh` (без `-l`, тогда
    текущей папкой останется папка проекта и `clients/`). Напрямую из PowerShell не запускай: он портит кавычки и пустые
    аргументы (`ssh-keygen -N ""` зависнет), в трубу добавляет `\r`, а `>` пишет файл в UTF-16, который WireGuard не примет.
    Если Git Bash нет: попроси человека поставить Git с https://git-scm.com/download/win и напиши «готово».
11а. **Как отправлять блоки на сервер.** Блок из инструкции: `<EU> 'bash -s' <<'EOF'` … `EOF`. Файл из Приложения:
    `<RU> 'cat > /root/vpn/cascade.sh' <<'EOF'` … `EOF`. Кавычки вокруг `'EOF'` обязательны: без них `$WAN`, `$C_PRIV`,
    `$(...)` подставятся на компьютере человека пустыми, и конфиги запишутся битыми.
12. **Долгие установки** (`apt`) на сервере запускай через `nohup setsid ... &` с логом и опрашивай лог: обрыв SSH
    не должен убить установку.
13. **Перед правкой работающего файла** делай копию `cp -p файл файл.bak-ГГГГММДД`.
14. Имя внешнего сетевого интерфейса сервера бывает разным (`ens3`, `eth0`). Узнаёшь его командой
    `ip route show default | awk '{print $5; exit}'`; в блоках ниже оно попадает в переменную `WAN` само.

### 2.2. Что строим (для тебя, человеку не пересказывай)

```
Устройство (WireGuard) --443/udp--> RU-сервер (Москва, reg.ru, вход wg0)
                                        | AmneziaWG 3.1 «awg_europe», маскировка, Table = off
                                        v
                         EU-сервер (Франкфурт, Senko, вход awg_ru) --> интернет
```

| Сервер | Что | Служба | Порт | Суть |
|---|---|---|---|---|
| EU | Вход для RU | `awg-quick@awg_ru` | случайный 20000–60000/udp | 10.68.68.1/30, пускает только `<RU_IP>` |
| RU | Вход для устройств | `wg-quick@wg0` | 443/udp | 10.70.70.0/24 и fd70:70:70::/64, MTU 1300 |
| RU | Связь с Европой | `awg-quick@awg_europe` | -> `<EU_IP>`:порт awg_ru | 10.68.68.2/30, PostUp/PostDown -> `cascade.sh` |

Принятые решения (не меняй):
- **Вход для устройств: обычный WireGuard на 443/udp.** Он есть на всех устройствах, до московского сервера reg.ru его
  пропускают. Через границу обычный WireGuard не проходит, поэтому между серверами AmneziaWG.
- **Каскад по схеме программиста:** пакеты со входа `wg0` получают метку `0x65`, правило `ip rule` отправляет их в таблицу
  `vpn_table`, там единственный маршрут `default dev awg_europe`. Всё это ставит и убирает `cascade.sh` при подъёме и
  остановке `awg_europe`.
- **Аварийный стоп:** в PostUp входа `wg0` правило: всё, что пришло со входа и уходит во внешний интерфейс, отклоняется.
  NAT во внешний интерфейс на RU нет вообще. Связь с Германией упала: у устройств нет интернета. Вернулась: всё идёт само.
- **IPv6 закрыт:** устройство получает свой внутренний IPv6 (fd70:…) и `AllowedIPs = 0.0.0.0/0, ::/0`, а сервер отвечает
  на любой IPv6 отказом. Браузер сразу уходит на IPv4 через Германию, российский IPv6 не утекает.
- **MTU 1300** на всём каскаде (туннель в туннеле), MSS прижимается.
- **Файрвол:** на EU iptables + netfilter-persistent; на RU ufw (он держит входящие порты и запрет пересылки по умолчанию),
  а правила каскада живут только в `cascade.sh` и PostUp/PostDown. На RU **не ставь** netfilter-persistent.
- **reg.ru отдаёт адрес через NAT:** на сетевой карте сервера частный адрес, публичный висит снаружи. Поэтому публичный
  адрес вешаем ещё и на `lo` (служба `vpn-public-ip`): так проверочный «двойник» на самом сервере подключается ко входу.

---

### Шаг 1. Одно сообщение человеку

Спроси одним сообщением и жди ответа:
- какая у него система на компьютере: Windows или Mac;
- выключен ли сейчас на компьютере другой VPN (если нет, пусть выключит на время сборки).

И одной строкой скажи, что будет дальше: «Сейчас откроем два сайта, ты зарегистрируешься и оплатишь серверы, остальное
я сделаю сам. Займёт около часа.»

**Проверка:** человек ответил про систему и про VPN.

### Шаг 2. Ключи доступа (на компьютере человека, делаешь сам)

```bash
mkdir -p ~/.ssh clients
[ -f ~/.ssh/eu_vpn_ed25519 ] || ssh-keygen -t ed25519 -N "" -C "agent-eu-vpn" -f ~/.ssh/eu_vpn_ed25519 -q
[ -f ~/.ssh/ru_bridge_ed25519 ] || ssh-keygen -t ed25519 -N "" -C "agent-ru-bridge" -f ~/.ssh/ru_bridge_ed25519 -q
ls ~/.ssh/eu_vpn_ed25519.pub ~/.ssh/ru_bridge_ed25519.pub
```

**Проверка:** оба `.pub` на месте.

### Шаг 3. Германия: Senko (человек регистрируется и оплачивает)

1. Открой страницу тарифов: `https://senko.digital/ru/budget-vps`
2. Напиши человеку ровно это (вместо `<ключ EU>` вставь одной строкой содержимое `~/.ssh/eu_vpn_ed25519.pub`; это публичный
   ключ, он не секрет):
   > Открыл сайт Senko. Сделай так:
   > 1. Зарегистрируйся (кнопка входа справа вверху, потом «Регистрация») и подтверди почту.
   > 2. На странице тарифов у **DE-BUDGET-1** (Франкфурт, 2,29 €) нажми «Заказать».
   > 3. Период: месяц. Система: **Ubuntu 22.04**. Никаких готовых шаблонов и программ (WireGuard, wg-easy, панели) не выбирай.
   > 4. Если в форме есть поле «SSH-ключ»: вставь туда ключ, я положил его в буфер обмена (Cmd+V или Ctrl+V).
   >    Если вставилось не то, скопируй его отсюда: `<ключ EU>`
   > 5. Оплати. Через пару минут сервер будет готов. Пришли мне его **IPv4-адрес**: четыре числа через точки, например
   >    `185.12.34.56` (он в кабинете в списке серверов и в письме). Пароль от сервера мне не присылай.
3. Сразу после этого сообщения положи ключ в буфер обмена (Mac: `pbcopy < ~/.ssh/eu_vpn_ed25519.pub`;
   Windows, Git Bash: `clip < ~/.ssh/eu_vpn_ed25519.pub`).
4. Жди адрес. Проверь формат: четыре числа от 0 до 255 через точки. Пришёл адрес с двоеточиями (IPv6): попроси IPv4.
   Дальше он `<EU_IP>`.

Попробуй войти по ключу:

```bash
ssh -i ~/.ssh/eu_vpn_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes root@<EU_IP> 'echo EU_OK; . /etc/os-release; echo $PRETTY_NAME'
```

Если `EU_OK`: ключ на месте. Если `Permission denied`: ключ при заказе не встал. Тогда дай человеку **одну команду**,
он вставит её в терминал и наберёт пароль root из письма Senko (символы при наборе не видны, это нормально):
- Mac: `ssh-copy-id -i ~/.ssh/eu_vpn_ed25519.pub root@<EU_IP>`
- Windows PowerShell:
  ```powershell
  $k = Get-Content "$env:USERPROFILE\.ssh\eu_vpn_ed25519.pub"; ssh -o StrictHostKeyChecking=accept-new root@<EU_IP> "mkdir -p ~/.ssh; chmod 700 ~/.ssh; echo '$k' >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; echo KEY_ADDED"
  ```

Твоя команда входа на EU дальше: `ssh -i ~/.ssh/eu_vpn_ed25519 -o IdentitiesOnly=yes root@<EU_IP>` (это `<EU>`).

**Проверка адреса EU по спискам блокировок** (делаешь сам на EU):

```bash
cd /tmp && for l in ip subnet; do curl -s --max-time 40 -o $l.lst https://antifilter.download/list/$l.lst; done; python3 - <<'PY'
import ipaddress
ip = "<EU_IP>"
exact = set(l.strip() for l in open("ip.lst") if l.strip())
subs = []
for l in open("subnet.lst"):
    l = l.strip()
    if l:
        try: subs.append(ipaddress.ip_network(l, strict=False))
        except ValueError: pass
a = ipaddress.ip_address(ip)
print("exact_ip_blocked:", ip in exact, "| subnet_blocked:", [str(x) for x in subs if a in x][:1] or "no")
PY
rm -f /tmp/ip.lst /tmp/subnet.lst
```

**Проверка:** вход по ключу `EU_OK`, система Ubuntu 22.04, `exact_ip_blocked: False | subnet_blocked: no`.
Адрес в блоке: раздел 3, признак «Адрес EU в списке блокировок».

### Шаг 4. Москва: reg.ru Облако (человек регистрируется и оплачивает)

1. Открой `https://cloud.reg.ru/panel/servers/order-server`
2. Напиши человеку ровно это (вместо `<ключ RU>` вставь одной строкой содержимое `~/.ssh/ru_bridge_ed25519.pub`):
   > Открыл reg.ru Облако. Сделай так:
   > 1. Если просит войти: «Зарегистрироваться», подтверди почту и телефон. Потом снова открой эту же вкладку.
   > 2. **Образы**: вкладка «ОС» -> «Ubuntu» -> версия **Ubuntu 24.04 LTS** (по умолчанию стоит 26.04, поменяй).
   > 3. **Тарифы и конфигурации**: «Стандартный» (если есть выбор SATA/NVMe, выбери NVMe) -> тариф **Free Tier C1-M1-D10** (0 ₽).
   > 4. **Регион размещения**: **Москва-3**.
   > 5. **Настройки сети**: публичный IP-адрес оставь, защита «Базовая».
   > 6. **Резервное копирование** не включай.
   > 7. **SSH-ключ**: «Новый SSH-ключ» -> вставь ключ, я положу его в буфер обмена прямо сейчас (Cmd+V или Ctrl+V).
   >    Если вставилось не то, скопируй его отсюда: `<ключ RU>`
   >    Название `vpn-agent`, сохрани и проверь, что этот ключ выбран.
   > 8. **Название сервера**: `vpn-msk`.
   > 9. Справа в «Итого» должно быть 0,00 ₽/час и строка «Бесплатный период 3 месяца». Нажми «Заказать сервер».
   >    Если попросит пополнить счёт: «Пополнить», 100 ₽, оплата по СБП или картой.
   > 10. Через 2–5 минут в списке серверов статус станет «Активен» и появится IP-адрес. Пришли его мне: четыре числа
   >     через точки, и он **не** начинается на `10.`, `172.` или `192.168.` (такие адреса внутренние, они не подходят).
3. Сразу после этого сообщения положи ключ в буфер обмена (Mac: `pbcopy < ~/.ssh/ru_bridge_ed25519.pub`;
   Windows, Git Bash: `clip < ~/.ssh/ru_bridge_ed25519.pub`).
4. Жди адрес. Проверь формат (IPv4, не внутренний). Дальше он `<RU_IP>`.

Если тарифа **Free Tier C1-M1-D10** в списке нет или reg.ru пишет, что он уже использован: раздел 3, признак
«Нет бесплатного тарифа».

5. Попроси человека включить письмо о низком балансе, чтобы VPN не встал неожиданно через 3 месяца.
   Открой `https://cloud.reg.ru/panel/finance` и напиши:
   > Последнее в reg.ru: блок «Уведомление о низком балансе» -> «Настроить» -> впиши 250 -> «Настроить уведомления».
   > Напиши «готово».

Попробуй войти по ключу (первый вход может занять пару минут, пока сервер дозагружается):

```bash
for i in $(seq 1 12); do r=$(ssh -i ~/.ssh/ru_bridge_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=10 root@<RU_IP> 'echo RU_OK; . /etc/os-release; echo $PRETTY_NAME' 2>&1); echo "$r" | tail -2; case "$r" in *RU_OK*) break;; *"Permission denied"*) break;; esac; sleep 15; done
```

Если `RU_OK`: ключ на месте. Если `Permission denied (publickey)`: у reg.ru ключ при создании иногда не встаёт
(у нас так было). Открой `https://cloud.reg.ru/panel/servers/` и напиши человеку:
> Ключ не встал, это особенность reg.ru, чинится переустановкой (сервер пустой, ничего не потеряем):
> открой сервер `vpn-msk` -> «Переустановить образ» -> «Ubuntu» -> «Ubuntu 24.04 LTS» -> в «SSH-ключ» выбери `vpn-agent`
> -> «Переустановить образ». Напиши «готово».

Потом повтори вход по ключу. После переустановки у сервера новый ключ хоста: если ssh ругается на смену ключа,
выполни `ssh-keygen -R <RU_IP>` и войди снова.

Если и после переустановки `Permission denied`: дай человеку одну команду, он наберёт пароль root (он в письме reg.ru
о создании сервера или на странице сервера; символы при наборе не видны):
- Mac: `ssh-copy-id -i ~/.ssh/ru_bridge_ed25519.pub root@<RU_IP>`
- Windows PowerShell:
  ```powershell
  $k = Get-Content "$env:USERPROFILE\.ssh\ru_bridge_ed25519.pub"; ssh -o StrictHostKeyChecking=accept-new root@<RU_IP> "mkdir -p ~/.ssh; chmod 700 ~/.ssh; echo '$k' >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; echo KEY_ADDED"
  ```

Твоя команда входа на RU дальше: `ssh -i ~/.ssh/ru_bridge_ed25519 -o IdentitiesOnly=yes root@<RU_IP>` (это `<RU>`).

**Проверка страны адреса** (сам, с компьютера человека):

```bash
curl -s --max-time 15 "http://ip-api.com/json/<RU_IP>?fields=countryCode,isp"
```

**Проверка:** вход по ключу `RU_OK`, система Ubuntu 24.04, `countryCode` = `RU`, isp reg.ru.
Не `RU`: раздел 3, признак «Адрес RU не российский».

### Шаг 5. EU-сервер: основа (делаешь сам)

Всё на EU от root. Своп и установка в фоне (обновление, AmneziaWG из официального репозитория), чтобы обрыв SSH
не убил установку:

```bash
if ! swapon --show | grep -q /swapfile; then fallocate -l 1G /swapfile; chmod 600 /swapfile; mkswap -q /swapfile; swapon /swapfile; grep -q "^/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab; fi
cat > /root/setup-base.sh <<"S"
#!/bin/bash
# One-off base setup of the EU server: updates, firewall tools, AmneziaWG from the official PPA
set -e
trap 'echo "SETUP_BASE_FAILED line $LINENO"' ERR
timeout 600 cloud-init status --wait >/dev/null 2>&1 || true
export DEBIAN_FRONTEND=noninteractive
echo "iptables-persistent iptables-persistent/autosave_v4 boolean true" | debconf-set-selections
echo "iptables-persistent iptables-persistent/autosave_v6 boolean true" | debconf-set-selections
A="-y -o DPkg::Lock::Timeout=600 -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold"
apt-get $A update
apt-get $A full-upgrade
apt-get $A install software-properties-common iptables-persistent netfilter-persistent python3 curl openssl qrencode tcpdump linux-headers-generic "linux-headers-$(uname -r)"
add-apt-repository -y ppa:amnezia/ppa
apt-get $A update
apt-get $A install amneziawg amneziawg-tools
echo SETUP_BASE_DONE
S
chmod 700 /root/setup-base.sh
nohup setsid /root/setup-base.sh > /root/setup-base.log 2>&1 < /dev/null &
```

Опрашивай `tail -3 /root/setup-base.log` раз в 30 секунд. Увидел `SETUP_BASE_DONE`: дальше. Увидел `SETUP_BASE_FAILED`:
покажи человеку 5 последних строк лога и спроси, как быть. Потом перезагрузи EU (`systemctl reboot`), подожди минуту, войди
и выполни:

```bash
modprobe amneziawg && echo "module OK"; awg --version; rm -f /root/setup-base.sh
cat > /etc/sysctl.d/99-vpn-forwarding.conf <<'E'
net.ipv4.ip_forward=1
net.ipv4.conf.all.src_valid_mark=1
net.ipv6.conf.all.forwarding=1
E
cat > /etc/sysctl.d/99-bbr.conf <<'E'
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
E
sysctl --system >/dev/null; sysctl net.ipv4.ip_forward
mkdir -p /root/vpn; chmod 700 /root/vpn; touch /root/vpn/params.env; chmod 600 /root/vpn/params.env
```

Файрвол: всё входящее закрыто, кроме SSH, ICMP и того, что откроем дальше; туннели AmneziaWG могут выходить в интернет,
но не друг в друга:

```bash
WAN=$(ip route show default | awk '{print $5; exit}'); echo "WAN=$WAN"
add4() { iptables -C "$@" 2>/dev/null || iptables -A "$@"; }
add6() { ip6tables -C "$@" 2>/dev/null || ip6tables -A "$@"; }
add4 INPUT -i lo -j ACCEPT
add4 INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
add4 INPUT -p tcp -m tcp --dport 22 -j ACCEPT
for t in 8 0 3 11 12; do add4 INPUT -p icmp -m icmp --icmp-type $t -j ACCEPT; done
add6 INPUT -i lo -j ACCEPT
add6 INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
add6 INPUT -p ipv6-icmp -j ACCEPT
add4 FORWARD -i awg+ -o awg+ -j DROP
add4 FORWARD -i awg+ -j ACCEPT
add4 FORWARD -o awg+ -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
add6 FORWARD -i awg+ -o awg+ -j DROP
add6 FORWARD -i awg+ -j ACCEPT
add6 FORWARD -o awg+ -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -P INPUT DROP; iptables -P FORWARD DROP; iptables -P OUTPUT ACCEPT
ip6tables -P INPUT DROP; ip6tables -P FORWARD DROP; ip6tables -P OUTPUT ACCEPT
iptables -t nat -C POSTROUTING -o $WAN -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -o $WAN -j MASQUERADE
netfilter-persistent save
```

**Проверка:** `module OK`; `ip_forward = 1`; `iptables -S FORWARD` показывает три правила `awg+`; `iptables -t nat -S POSTROUTING`
показывает MASQUERADE на внешний интерфейс.

### Шаг 6. RU-сервер: основа (делаешь сам)

Всё на RU от root. Файрвол ufw (порядок важен: сначала разрешить SSH, потом включить):

```bash
timeout 600 cloud-init status --wait >/dev/null 2>&1 || true
command -v ufw >/dev/null || { apt-get update -qq; apt-get install -y -qq ufw; }
ufw allow 22/tcp >/dev/null
ufw allow 443/udp comment "wg0 devices, cascade entry" >/dev/null
ufw --force enable >/dev/null
ufw status; grep DEFAULT_FORWARD_POLICY /etc/default/ufw
```

Ожидаемо: открыты только `22/tcp` и `443/udp` (v4 и v6), `DEFAULT_FORWARD_POLICY="DROP"`.

Своп и установка в фоне (обновление, WireGuard, AmneziaWG той же сборки, что на EU):

```bash
if ! swapon --show | grep -q /swapfile; then fallocate -l 1G /swapfile; chmod 600 /swapfile; mkswap -q /swapfile; swapon /swapfile; grep -q "^/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab; fi
cat > /root/setup-base.sh <<"S"
#!/bin/bash
# One-off base setup of the RU server: updates, AmneziaWG from the same PPA as the EU server, WireGuard tools
set -e
trap 'echo "SETUP_BASE_FAILED line $LINENO"' ERR
timeout 600 cloud-init status --wait >/dev/null 2>&1 || true
export DEBIAN_FRONTEND=noninteractive
A="-y -o DPkg::Lock::Timeout=600 -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold"
apt-get $A update
apt-get $A full-upgrade
apt-get $A install software-properties-common linux-headers-generic "linux-headers-$(uname -r)" wireguard-tools qrencode curl tcpdump
add-apt-repository -y ppa:amnezia/ppa
apt-get $A update
apt-get $A install amneziawg
echo SETUP_BASE_DONE
S
chmod 700 /root/setup-base.sh
nohup setsid /root/setup-base.sh > /root/setup-base.log 2>&1 < /dev/null &
```

Жди `SETUP_BASE_DONE` в `/root/setup-base.log` (опрашивай `tail -3 /root/setup-base.log` раз в 30 секунд).
Увидел `SETUP_BASE_FAILED`: покажи человеку 5 последних строк лога и спроси, как быть.
Потом перезагрузи RU (`systemctl reboot`), войди снова, проверь `modprobe amneziawg && echo module OK`, удали `/root/setup-base.sh`.

Пересылка пакетов и публичный адрес на `lo` (замени `<RU_IP>`):

```bash
cat > /etc/sysctl.d/99-vpn-cascade.conf <<'E'
net.ipv4.ip_forward = 1
net.ipv4.conf.all.rp_filter = 2
net.ipv4.conf.default.rp_filter = 2
net.ipv6.conf.all.forwarding = 1
net.ipv6.conf.all.disable_ipv6 = 0
net.ipv6.conf.default.disable_ipv6 = 0
E
sysctl -q --system
[ -e /proc/net/if_inet6 ] && [ "$(sysctl -n net.ipv6.conf.all.disable_ipv6)" = 0 ] && echo IPV6_OK || echo IPV6_MISSING
RU_IP=<RU_IP>
if ip -4 addr show | grep -q " $RU_IP/"; then echo "public IP is on an interface already"; else
cat > /etc/systemd/system/vpn-public-ip.service <<U
[Unit]
Description=Public IP $RU_IP on lo (cloud 1:1 NAT), so local selftest twins reach the VPN entry
Before=wg-quick@wg0.service
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/sbin/ip addr replace $RU_IP/32 dev lo
ExecStop=/sbin/ip addr del $RU_IP/32 dev lo
[Install]
WantedBy=multi-user.target
U
systemctl daemon-reload; systemctl enable --now vpn-public-ip; fi
sysctl net.ipv4.ip_forward net.ipv4.conf.all.rp_filter; ip -4 addr show | grep " $RU_IP/"
```

**Проверка:** `module OK`; `IPV6_OK` (нужен для внутренних IPv6-адресов устройств; `IPV6_MISSING`: остановись, покажи
человеку вывод и спроси); версии AmneziaWG на RU и EU из одного репозитория (`dpkg-query -W amneziawg-dkms` на обоих:
в строке совпадает часть после `~`, кроме названия системы); `ip_forward = 1`, `rp_filter = 2`; `<RU_IP>` виден на интерфейсе.

### Шаг 7. Каскад (делаешь сам)

**7.1. Параметры связи на EU** (ключи EU-стороны и маскировка; хранятся в `params.env` EU):

```bash
cd /root/vpn
grep -q "^C_PORT=" params.env && { echo "C_ already present, stop"; exit 1; }
r() { shuf -i $1-$2 -n 1; }
while :; do P=$(r 20000 60000); ss -lun | grep -q ":$P " || break; done
S1=$(r 15 150); S3=$(r 12 64); S4=$(r 12 32)
while :; do S2=$(r 15 150); [ $S2 -ne $((S1+56)) ] && [ $((92+S2)) -ne $((64+S3)) ] && break; done
K=$(awg genkey)
umask 077
cat >> params.env <<E
# Cascade link awg_ru: RU server -> here
RU_IP=<RU_IP>
C_PORT=$P
C_PRIV=$K
C_PUB=$(echo "$K" | awg pubkey)
C_PSK=$(awg genpsk)
C_HPK=$(openssl rand -base64 32)
C_S1=$S1
C_S2=$S2
C_S3=$S3
C_S4=$S4
E
. ./params.env
echo "port $C_PORT; S1-S4 $C_S1 $C_S2 $C_S3 $C_S4; HPK length ${#C_HPK}"
```

**7.2. Ключи RU-стороны** (на RU):

```bash
mkdir -p /root/vpn/clients; chmod 700 /root/vpn; cd /root/vpn
if [ ! -f params.env ]; then umask 077; E=$(awg genkey); W=$(wg genkey); cat > params.env <<P
# RU server cascade params. Secrets: never print.
RU_IP=<RU_IP>
W_PORT=443
W_PRIV=$W
W_PUB=$(echo "$W" | wg pubkey)
E_PRIV=$E
E_PUB=$(echo "$E" | awg pubkey)
P
fi
. ./params.env; echo "RU awg_europe public key: $E_PUB"
```

Публичный ключ из вывода дальше `<RU_E_PUB>` (это не секрет).

**7.3. Общие параметры связи EU -> RU трубой, не через чат** (с компьютера человека; `<EU>` и `<RU>` это твои команды входа):

```bash
<EU> 'cd /root/vpn; grep -E "^C_(PORT|PUB|PSK|HPK|S[1-4])=" params.env' | <RU> 'cd /root/vpn; if ! grep -q "^C_PORT=" params.env; then { echo "# Link to EU awg_ru (copied from EU params.env)"; tr -d "\r"; } >> params.env; fi; . ./params.env; echo "RU got: C_PORT=$C_PORT S=$C_S1/$C_S2/$C_S3/$C_S4 HPK_len=${#C_HPK} PSK_len=${#C_PSK}"'
```

**7.4. Вход для RU на EU** (`awg_ru`, пускает только `<RU_IP>`; замени `<RU_E_PUB>`):

```bash
cd /root/vpn; . ./params.env
F=/etc/amnezia/amneziawg/awg_ru.conf
[ -f $F ] && { echo "awg_ru.conf exists, stop"; exit 1; }
umask 077
cat > $F <<C
# Cascade link: the RU server ($RU_IP) connects here as its awg_europe. Only $RU_IP is let in (iptables).
[Interface]
PrivateKey = $C_PRIV
Address = 10.68.68.1/30
ListenPort = $C_PORT
MTU = 1300
Jc = 4
Jmin = 40
Jmax = 120
S1 = $C_S1
S2 = $C_S2
S3 = $C_S3
S4 = $C_S4
H1 = 1
H2 = 2
H3 = 3
H4 = 4
HeaderProtectionKey = $C_HPK
ContentPaddingAddition = 0-32
RandomTrailers = on

[Peer]
# ru-bridge (RU server)
PublicKey = <RU_E_PUB>
PresharedKey = $C_PSK
AllowedIPs = 10.68.68.2/32
C
iptables -C INPUT -s $RU_IP/32 -p udp --dport $C_PORT -j ACCEPT 2>/dev/null || iptables -A INPUT -s $RU_IP/32 -p udp --dport $C_PORT -j ACCEPT
netfilter-persistent save 2>&1 | tail -1
systemctl enable --now awg-quick@awg_ru
systemctl is-active awg-quick@awg_ru
awg show awg_ru | grep -E "interface|listening|peer|allowed"
```

**7.5. Файлы каскада на RU.** Положи дословно из Приложения в `/root/vpn/` и сделай `chmod 700`: `cascade.sh`, `add-device.sh`,
`remove-device.sh`, `selftest.sh` (в нём замени `<EU_IP>`). Проверь `bash -n` каждого. Затем связь с Европой и вход
WireGuard (в блоке замени `<EU_IP>` в двух местах):

```bash
set -e
cd /root/vpn; . ./params.env
WAN=$(ip route show default | awk '{print $5; exit}'); echo "WAN=$WAN"
umask 077
[ -f /etc/amnezia/amneziawg/awg_europe.conf ] || cat > /etc/amnezia/amneziawg/awg_europe.conf <<C
# Cascade link to the EU server. Table = off: only marked packets go here, see /root/vpn/cascade.sh (programmer recipe).
[Interface]
PrivateKey = $E_PRIV
Address = 10.68.68.2/30
MTU = 1300
Table = off
Jc = 4
Jmin = 40
Jmax = 120
S1 = $C_S1
S2 = $C_S2
S3 = $C_S3
S4 = $C_S4
H1 = 1
H2 = 2
H3 = 3
H4 = 4
HeaderProtectionKey = $C_HPK
ContentPaddingAddition = 0-32
RandomTrailers = on
PostUp = /root/vpn/cascade.sh up
PostDown = /root/vpn/cascade.sh down

[Peer]
# EU server <EU_IP>, interface awg_ru
PublicKey = $C_PUB
PresharedKey = $C_PSK
Endpoint = <EU_IP>:$C_PORT
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
C
[ -f /etc/wireguard/wg0.conf ] || cat > /etc/wireguard/wg0.conf <<C
# Cascade entry: WireGuard for devices (/root/vpn/add-device.sh, remove-device.sh).
# Kill switch: nothing from wg0 goes out of Russia (IPv4 to $WAN rejected, any IPv6 rejected). Link to Europe down = no internet.
[Interface]
Address = 10.70.70.1/24
Address = fd70:70:70::1/64
MTU = 1300
PostUp = iptables -I FORWARD -i wg0 -o $WAN -j REJECT --reject-with icmp-net-unreachable; ip6tables -I FORWARD -i wg0 -j REJECT --reject-with icmp6-adm-prohibited
PostDown = iptables -D FORWARD -i wg0 -o $WAN -j REJECT --reject-with icmp-net-unreachable; ip6tables -D FORWARD -i wg0 -j REJECT --reject-with icmp6-adm-prohibited
ListenPort = $W_PORT
PrivateKey = $W_PRIV
C
systemctl enable --now wg-quick@wg0
systemctl enable --now awg-quick@awg_europe
sleep 3
echo "services: $(systemctl is-active wg-quick@wg0 awg-quick@awg_europe | tr "\n" " ")"
awg show awg_europe | grep -E "endpoint|handshake|transfer"
echo "--- ip rule:"; ip rule | grep 0x65; echo "--- vpn_table:"; ip route show table vpn_table
```

**Проверка:** обе службы `active`; у `awg_europe` свежее рукопожатие (`latest handshake: N seconds ago`);
в `ip rule` есть `fwmark 0x65 lookup vpn_table`; в `vpn_table` ровно `default dev awg_europe`.
Нет рукопожатия: раздел 3, признак «Нет связи RU -> EU».

### Шаг 8. Самопроверка на RU (делаешь сам)

```bash
cd /root/vpn && ./selftest.sh
```

Ожидаемо `PASS` ×5: свежая связь с Европой; выход через неё = `<EU_IP>`; правила каскада на месте; аварийный стоп на месте;
двойник `twin` (проверочное устройство на самом сервере) выходит в интернет с `<EU_IP>`.

Затем аварийный стоп вживую и «само прописывается и очищается»:

```bash
cd /root/vpn; . ./params.env
cnt() { echo "mark:$(iptables -t mangle -S PREROUTING | grep -c 0x65) rule:$(ip rule | grep -c 0x65) table:$(ip route show table vpn_table 2>/dev/null | wc -l) nat:$(iptables -t nat -S POSTROUTING | grep -c awg_europe)"; }
cnt
systemctl stop awg-quick@awg_europe; sleep 2; cnt
./selftest.sh 2>&1 | grep -E "twin"; echo "^ twin above must FAIL with an empty exit (no internet), NOT <RU_IP>"
systemctl start awg-quick@awg_europe; sleep 5; cnt
./selftest.sh
```

**Проверка:**
- `cnt` до: `mark:2 rule:1 table:1 nat:1`; после `stop`: всё `0`; после `start`: снова `2 1 1 1`.
- Пока связь выключена, у двойника пусто (`got ''`). Если там `<RU_IP>` или любой российский адрес: аварийный стоп не работает,
  дальше не иди, проверь PostUp в `wg0.conf` и `WAN`.
- Последний `selftest.sh`: PASS ×5.

Перезагрузи **оба** сервера (`systemctl reboot` на каждом), подожди 2 минуты, войди и снова `./selftest.sh` на RU:
PASS ×5, всё поднялось само.

### Шаг 9. Проверка снаружи, через интернет (делаешь сам)

Временный клиент на EU подключается к RU через интернет и должен выйти с `<EU_IP>`. Перенеси конфиг двойника на EU
трубой (не через чат):

```bash
<RU> 'cat /root/vpn/clients/twin/ru-twin.conf' | <EU> 'umask 077; tr -d "\r" > /root/probe-wg.conf'
```

На EU (замени `<RU_IP>`; клиент WireGuard поднимаем модулем AmneziaWG: без параметров маскировки он совместим):

```bash
WAN=$(ip route show default | awk '{print $5; exit}')
CONF=/root/probe-wg.conf; A4=$(grep ^Address $CONF | grep -oE "10\.[0-9.]+")
ip netns del probe 2>/dev/null; ip link del ph 2>/dev/null
ip netns add probe; ip link add ph type veth peer name pc; ip link set pc netns probe
ip addr add 10.202.0.1/30 dev ph; ip link set ph up
ip netns exec probe ip addr add 10.202.0.2/30 dev pc; ip netns exec probe ip link set pc up
ip netns exec probe ip route add <RU_IP>/32 via 10.202.0.1
iptables -I FORWARD -i ph -o $WAN -j ACCEPT; iptables -I FORWARD -i $WAN -o ph -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
mkdir -p /etc/netns/probe; echo "nameserver 1.1.1.1" > /etc/netns/probe/resolv.conf
ip netns exec probe ip link add awp type amneziawg
ip netns exec probe awg setconf awp <(awg-quick strip $CONF)
ip netns exec probe ip addr add $A4/32 dev awp; ip netns exec probe ip link set mtu 1300 up dev awp
ip netns exec probe ip route replace default dev awp
echo "exit IP: $(ip netns exec probe curl -4 -s --max-time 15 https://ifconfig.co)"
echo "20 MB, Mbit/s: $(ip netns exec probe curl -4 -s -o /dev/null --max-time 60 -w "%{speed_download}" "https://speed.cloudflare.com/__down?bytes=20000000" | awk '{printf "%.1f", $1*8/1e6}')"
ip netns exec probe ip link del awp; ip netns del probe; ip link del ph 2>/dev/null; rm -rf /etc/netns/probe
iptables -D FORWARD -i ph -o $WAN -j ACCEPT; iptables -D FORWARD -i $WAN -o ph -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
rm -f /root/probe-wg.conf; echo "leftover ph rules: $(iptables -S FORWARD | grep -c ' ph ')"
```

**Проверка:** `exit IP` = `<EU_IP>`, скорость больше нуля, `leftover ph rules: 0`. После этого двойник «переехал» на EU:
следующий `./selftest.sh` на RU вернёт его сам (запусти, PASS ×5).

**Закрыть вход по паролю на обоих серверах** (дальше входишь только ты по ключу; пароль человеку больше не нужен).
На каждом сервере, сначала EU, потом RU. Страховка: если новый вход по ключу не пройдёт, через 3 минуты всё откатится само.

```bash
cat > /etc/ssh/sshd_config.d/01-vpn.conf <<"C"
# root logs in by key only. The hosting panel console still takes the root password.
PasswordAuthentication no
KbdInteractiveAuthentication no
C
systemd-run -q --on-active=180 --unit=ssh-revert /bin/sh -c "rm -f /etc/ssh/sshd_config.d/01-vpn.conf; systemctl reload ssh"
sshd -t && systemctl reload ssh && sshd -T | grep -E "^(passwordauthentication|kbdinteractiveauthentication) "
```

Затем **новым** входом по ключу на этот сервер: `systemctl stop ssh-revert.timer && echo REVERT_STOPPED`.
Файл должен начинаться на `01-`: в Ubuntu действует первое значение, а у хостингов бывает свой файл с `PasswordAuthentication yes`.

Нет `REVERT_STOPPED`, а `sshd -T | grep passwordauthentication` показывает `yes`: откат уже сработал (прошло больше 3 минут).
Повтори блок и сразу войди заново.

**Проверка:** на обоих серверах `passwordauthentication no`, `kbdinteractiveauthentication no` и `REVERT_STOPPED`.

### Шаг 10. Устройства человека

Спроси одним сообщением: «Какие устройства подключаем? Напиши списком: например, ноутбук, айфон, телефон жены.»

Для каждого устройства придумай имя латиницей (`noutbuk`, `iphone`, `phone-zhena`; только `a-z 0-9 -`, до 12 символов:
WireGuard берёт имя туннеля из имени файла `nv-<имя>`, а длиннее 15 символов Android и Windows не принимают) и сделай файл.
На RU (для телефона ещё и картинку QR):

```bash
cd /root/vpn && ./add-device.sh <имя>
qrencode -t PNG -s 10 -m 4 -o clients/<имя>/qr.png < clients/<имя>/ru-<имя>.conf   # только для телефонов
```

Забери файлы к человеку **без вывода в чат**, через scp (он не портит файлы на Windows):

```bash
mkdir -p clients
scp -i ~/.ssh/ru_bridge_ed25519 -o IdentitiesOnly=yes root@<RU_IP>:/root/vpn/clients/<имя>/ru-<имя>.conf clients/nv-<имя>.conf
scp -i ~/.ssh/ru_bridge_ed25519 -o IdentitiesOnly=yes root@<RU_IP>:/root/vpn/clients/<имя>/qr.png clients/nv-<имя>-qr.png   # только для телефонов
```

Открой папку `clients` у человека на экране (Mac: `open clients`; Windows: `explorer.exe clients`) и напиши ему:
> Файлы для твоих устройств лежат в открытой папке. Как поставить:
> - **Компьютер:** поставь WireGuard с https://www.wireguard.com/install/ -> «Импорт туннеля из файла» -> выбери файл
>   с именем этого компьютера -> «Подключить».
> - **Телефон:** поставь приложение WireGuard (App Store или Google Play) -> «+» -> «Создать из QR-кода» -> наведи камеру
>   на картинку этого телефона на экране компьютера -> имя туннеля латиницей -> включи.
> - Один файл только на одно устройство. Другой VPN на устройстве выключи.
> Потом на каждом устройстве открой https://ifconfig.co и пришли мне, какой адрес там показан.
> Телефон проверь ещё и так: выключи Wi-Fi, оставь мобильный интернет, снова открой https://ifconfig.co и пришли адрес.

**Проверка:** на каждом устройстве ifconfig.co показывает `<EU_IP>`, на телефоне и через мобильный интернет тоже: это и есть
проверка, что провайдер человека не режет вход. На RU по устройству (строку `wg show wg0 dump` целиком не выводи: в ней общий ключ):

```bash
cd /root/vpn; N=$(grep ^Address clients/<имя>/ru-<имя>.conf | grep -oE '10\.70\.70\.[0-9]+')
wg show wg0 dump | awk -v ip="$N/32" -v now=$(date +%s) 'index($4, ip) {print "handshake_age_s=" now-$5, "rx=" $6, "tx=" $7}'
```

Свежее рукопожатие: `handshake_age_s` меньше 180; `rx` и `tx` растут, если повторить через минуту. «Подключено», а интернета нет и счётчик
«received» стоит на месте: раздел 3, признак «Провайдер режет WireGuard до Москвы».

Добавить устройство потом: человек пишет тебе «добавь устройство <что это>», ты повторяешь этот шаг для одного имени.
Удалить: `./remove-device.sh <имя>` на RU.

### Шаг 11. Деньги: одно сообщение человеку

Посчитай дату окончания бесплатного периода reg.ru (дата заказа сервера + 3 месяца) и дату следующей оплаты Senko
(из кабинета Senko или +1 месяц от заказа) и напиши:
> Всё готово. Чтобы VPN не встал:
> - **reg.ru:** бесплатно до <дата>. Дальше около 700 ₽ в месяц списывается по часам с облачного счёта.
>   До <дата> положи на облачный счёт 700 ₽ или больше (reg.ru -> облачный счёт -> «Пополнить»). Письмо придёт,
>   когда останется меньше 250 ₽.
> - **Senko:** 2,29 € до <дата>, потом продли в кабинете Senko на месяц или сразу на три (скидка 5%).
> - Торренты через VPN не качай: на это жалуются в Германии, и хостинг может отключить сервер.

Если в шаге 4 сработал признак «Нет бесплатного тарифа», первый пункт замени на:
> - **reg.ru:** около 700 ₽ в месяц, списывается по часам с облачного счёта. Держи на облачном счёте не меньше 700 ₽
>   (reg.ru -> облачный счёт -> «Пополнить»). Письмо придёт, когда останется меньше 250 ₽.

### Шаг 12. Приёмка: «готово», когда всё это показано выводом или подтверждено человеком

- [ ] EU: вход по ключу, адрес не в списках блокировок, MASQUERADE и правила `awg+` на месте, `awg_ru` active.
- [ ] RU: Ubuntu 24.04, страна адреса RU, ufw: снаружи только 22/tcp и 443/udp, пересылка по умолчанию DROP.
- [ ] RU: `selftest.sh` PASS ×5; правила `2 1 1 1` -> `0` -> `2 1 1 1` при выключении и включении `awg_europe`.
- [ ] Аварийный стоп: при выключенной связи у двойника нет интернета (не российский адрес).
- [ ] Перезагрузка обоих серверов: всё поднялось само, PASS ×5.
- [ ] Снаружи: клиент на EU через `<RU_IP>:443` выходит с `<EU_IP>`.
- [ ] Вход по паролю закрыт на обоих серверах, страховочный откат остановлен.
- [ ] Человек: каждое его устройство показывает на ifconfig.co `<EU_IP>`; один телефон проверен на мобильном интернете.
- [ ] Человек получил сообщение про деньги (шаг 11); письмо reg.ru при 250 ₽ включено (человек написал «готово»).

После этого напиши человеку «Готово, VPN работает» и больше ничего не предлагай.

---

## Часть 3. Только если сломалось

Открывай нужный пункт, только если увидел его признак. Делай ровно то, что там написано, и возвращайся в шаг, из которого пришёл.

**«Нет бесплатного тарифа»** (в шаге 4 нет Free Tier C1-M1-D10, или reg.ru пишет, что бесплатный период уже использован).
Скажи человеку выбрать в «Стандартный» тариф **Stdp C1-M1-D10** (около 513 ₽ в месяц) и положить на облачный счёт 800 ₽
(сервер 513 + адрес 187 в месяц, списание по часам). Остальные пункты заказа те же.

**«Адрес RU не российский»** (в шаге 4 `countryCode` не `RU`). Скажи человеку: открыть сервер `vpn-msk` -> «Удалить»
(сервер пустой, ничего не теряем), потом заказать заново по шагу 4, но в «Регион размещения» выбрать **Москва-2**.
Проверь страну снова.

**«Адрес EU в списке блокировок»** (шаг 3). Скажи человеку написать в поддержку Senko из кабинета: «Прошу сменить IPv4-адрес
сервера, текущий адрес недоступен из России». Текст пишет он сам: поддержка просит подтвердить, что пишет человек, а не ИИ.
Новый адрес проверь тем же блоком шага 3.

**«Нет связи RU -> EU»** (в шаге 7 у `awg_europe` нет рукопожатия). По порядку, после каждого пункта смотри рукопожатие:
1. На EU: `systemctl is-active awg-quick@awg_ru`; `iptables -S INPUT | grep <порт C_PORT>` есть правило с `-s <RU_IP>/32`.
2. На RU: `grep Endpoint /etc/amnezia/amneziawg/awg_europe.conf` = `<EU_IP>:C_PORT`; `<RU_E_PUB>` в `awg_ru.conf` на EU
   совпадает с `E_PUB` из `params.env` RU.
3. На EU: `timeout 40 tcpdump -ni any -c 5 udp port <C_PORT>` и сразу на RU `systemctl restart awg-quick@awg_europe`.
   Пакеты приходят не с `<RU_IP>` (так бывает из-за NAT хостинга): на EU замени адрес в правиле iptables на тот, что видишь
   (`iptables -D INPUT -s <RU_IP>/32 -p udp --dport <C_PORT> -j ACCEPT; iptables -A INPUT -s <видимый адрес>/32 -p udp --dport <C_PORT> -j ACCEPT;
   netfilter-persistent save`). Пакеты приходят с `<RU_IP>`, а ответа нет: смотри пункт 2. Пакеты не приходят: опиши
   человеку и спроси, как быть.

**«Провайдер режет WireGuard до Москвы»** (шаг 10: на устройстве «Подключено», ifconfig.co не открывается, на RU в `wg show wg0`
у устройства рукопожатие старше 3 минут или «received» не растёт). Сначала убедись, что на устройстве нет другого VPN
и что этот же файл не стоит на втором устройстве. Если режут: поставь замаскированный вход AmneziaWG на RU
(порт 8443, первый пакет похож на QUIC) и дай этому устройству файл для него:

```bash
cd /root/vpn   # положи из Приложения setup-awg-entry.sh и add-awg.sh, chmod 700, bash -n
./setup-awg-entry.sh
ufw allow 8443/udp comment "awg_entry: masked entry" >/dev/null
systemctl enable --now awg-quick@awg_entry
systemctl restart awg-quick@awg_europe      # cascade.sh up adds the mark for awg_entry too
./selftest.sh                               # now PASS x6: twin-awg checks the masked entry
./add-awg.sh <имя>-awg
```

Файл `clients/<имя>-awg/ru-awg-<имя>-awg.conf` забери к человеку так же, как в шаге 10 (и QR для телефона). На устройство нужно
приложение **AmneziaWG** (не «Amnezia VPN»): iPhone/iPad/Mac: App Store, Android: Google Play, Windows:
https://github.com/amnezia-vpn/amneziawg-windows-client/releases . Импорт файла или QR -> «Подключить» -> ifconfig.co = `<EU_IP>`.
Старый WireGuard-туннель на этом устройстве выключи.

**«reg.ru не работает»** (reg.ru не даёт заказать сервер, недоступен или отключил сервер). Только в этом случае спроси
человека, на каком российском хостинге он возьмёт сервер, и назови условия: сервер в Москве, почасовая оплата, чистая
Ubuntu 24.04, публичный IPv4. Когда он пришлёт новый адрес (`<RU_IP>`):
1. Шаг 4 без кнопок reg.ru: вход по ключу (ключ он вставит в форму заказа или одной командой с паролем, как для EU),
   проверка страны. Шаг 6 целиком.
2. Шаг 7.2 и 7.3 на новом сервере. Шаг 7.1 и 7.4 на EU **не повторяй** (они остановятся на своих защитах), вместо них на EU
   (замени `<RU_IP>` и `<RU_E_PUB>` новыми):
   ```bash
   cd /root/vpn; OLD=$(grep ^RU_IP= params.env | cut -d= -f2); . ./params.env
   sed -i "s|^RU_IP=.*|RU_IP=<RU_IP>|" params.env
   sed -i "s|^PublicKey = .*|PublicKey = <RU_E_PUB>|" /etc/amnezia/amneziawg/awg_ru.conf
   iptables -D INPUT -s $OLD/32 -p udp --dport $C_PORT -j ACCEPT 2>/dev/null || true
   iptables -C INPUT -s <RU_IP>/32 -p udp --dport $C_PORT -j ACCEPT 2>/dev/null || iptables -A INPUT -s <RU_IP>/32 -p udp --dport $C_PORT -j ACCEPT
   netfilter-persistent save 2>&1 | tail -1; systemctl restart awg-quick@awg_ru; systemctl is-active awg-quick@awg_ru
   ```
3. Шаг 7.5 и дальше шаги 8–10 на новом сервере. Устройства человека получат новые файлы.

---

## Часть 4. Уже собрано по версии 1 или 2 (FirstVDS)

Сначала спроси человека одним сообщением: «Как сейчас работает VPN: открой на телефоне с мобильным интернетом без Wi-Fi и на
компьютере без другого VPN https://ifconfig.co и пришли адреса.» Дальше одна из двух веток.

### 4.1. Всё работает (ifconfig.co показывает `<EU_IP>`): переезжать не надо

Обновляешь RU-сервер на месте, люди не отключатся. Всё на RU от root.

**1) Скрипты версии 3.** Положи из Приложения в `/root/vpn/`: `cascade.sh`, `add-device.sh`, `remove-device.sh`, `selftest.sh`
(замени `<EU_IP>`), `chmod 700`, `bash -n`. Старые `add-laptop.sh` и `remove-laptop.sh` не удаляй, дальше пользуйся новыми.

**2) IPv6 должен быть включён:**

```bash
cat > /etc/sysctl.d/99-vpn-ipv6.conf <<'E'
net.ipv6.conf.all.forwarding = 1
net.ipv6.conf.all.disable_ipv6 = 0
net.ipv6.conf.default.disable_ipv6 = 0
E
sysctl -q -p /etc/sysctl.d/99-vpn-ipv6.conf
[ -e /proc/net/if_inet6 ] && [ "$(sysctl -n net.ipv6.conf.all.disable_ipv6)" = 0 ] && echo IPV6_OK || echo IPV6_MISSING
```

`IPV6_MISSING`: остановись, покажи человеку вывод и спроси.

**3) Аварийный стоп и закрытый IPv6 на входах в форме версии 3** (для `wg0` и, если есть, запасного `awg_entry`; можно
запускать повторно, дублей не будет; если вход не поднят, блок поправит только файл):

```bash
set -e; cd /root/vpn; WAN=$(ip route show default | awk '{print $5; exit}')
for X in "wg0 70 /etc/wireguard/wg0.conf" "awg_entry 71 /etc/amnezia/amneziawg/awg_entry.conf"; do
  set -- $X; E=$1; K=$2; F=$3; [ -f $F ] || continue
  cp -p $F $F.bak-$(date +%Y%m%d%H%M)
  # config: the same after a reboot
  sed -i "s|^PostUp = .*|PostUp = iptables -I FORWARD -i $E -o $WAN -j REJECT --reject-with icmp-net-unreachable; ip6tables -I FORWARD -i $E -j REJECT --reject-with icmp6-adm-prohibited|" $F
  sed -i "s|^PostDown = .*|PostDown = iptables -D FORWARD -i $E -o $WAN -j REJECT --reject-with icmp-net-unreachable; ip6tables -D FORWARD -i $E -j REJECT --reject-with icmp6-adm-prohibited|" $F
  grep -q "fd$K:$K:$K::1/64" $F || sed -i "s|^Address = 10.$K.$K.1/24\$|Address = 10.$K.$K.1/24, fd$K:$K:$K::1/64|" $F
  grep -E "^(Address|PostUp|PostDown)" $F
  # live, only if the entry is up: the stop first, then remove the old way out of Russia
  ip link show $E >/dev/null 2>&1 || continue
  iptables -C FORWARD -i $E -o $WAN -j REJECT --reject-with icmp-net-unreachable 2>/dev/null || iptables -I FORWARD -i $E -o $WAN -j REJECT --reject-with icmp-net-unreachable
  ip6tables -C FORWARD -i $E -j REJECT --reject-with icmp6-adm-prohibited 2>/dev/null || ip6tables -I FORWARD -i $E -j REJECT --reject-with icmp6-adm-prohibited
  while iptables -D FORWARD -i $E ! -o awg_europe -j REJECT --reject-with icmp-admin-prohibited 2>/dev/null; do :; done
  while iptables -t nat -D POSTROUTING -s 10.$K.$K.0/24 -o $WAN -j MASQUERADE 2>/dev/null; do :; done
  while iptables -D FORWARD -i $E -o $WAN -j ACCEPT 2>/dev/null; do :; done
  while iptables -D FORWARD -i $WAN -o $E -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null; do :; done
  ip -6 addr show dev $E | grep -q "fd$K:$K:$K::1" || ip -6 addr add fd$K:$K:$K::1/64 dev $E
done
```

**4) IPv6 в файлах устройств.** Старые файлы IPv6 не закрывают: в них `AllowedIPs = 0.0.0.0/0`, и IPv6 устройства идёт мимо
туннеля напрямую. Допиши его (входы должны быть подняты; людям потом заново импортировать обновлённый файл, как в шаге 10):

```bash
set -e; cd /root/vpn
for X in "wg0 70 wg" "awg_entry 71 awg"; do
  set -- $X; E=$1; K=$2; T=$3; ip link show $E >/dev/null 2>&1 || continue
  for F in clients/*/ru-*.conf; do
    case "$F" in clients/_removed/*|clients/twin*) continue;; esac
    N=$(grep ^Address "$F" | grep -oE "10\.$K\.$K\.[0-9]+" | cut -d. -f4); [ -n "$N" ] || continue
    grep -q "fd$K:$K:$K::" "$F" && continue
    PUB=$(grep ^PrivateKey "$F" | cut -d= -f2- | tr -d ' ' | $T pubkey)
    $T set $E peer "$PUB" allowed-ips 10.$K.$K.$N/32,fd$K:$K:$K::$N/128
    sed -i "s|^Address = 10.$K.$K.$N/32.*|Address = 10.$K.$K.$N/32, fd$K:$K:$K::$N/128|; s|^AllowedIPs = 0.0.0.0/0\$|AllowedIPs = 0.0.0.0/0, ::/0|" "$F"
    echo "updated $F"
  done
  $T-quick save $E
done
```

Туннели, которые создавали в панели WGDashboard, в `clients/` не лежат: этим людям выдай новые файлы `./add-device.sh <имя>`
(шаг 10), а старые туннели удали в панели.

**Проверка:** `IPV6_OK`; `./selftest.sh` PASS ×5 (×6, если есть `awg_entry`); `ip6tables -S FORWARD | grep -c "wg0.*REJECT"` = 1;
`ip -6 addr show dev wg0 | grep fd70`; на устройстве с обновлённым файлом ifconfig.co = `<EU_IP>`.

### 4.2. «Подключено», а интернета нет: переезд на reg.ru

Признак: с обычного домашнего или мобильного интернета без другого VPN туннель «подключён», ifconfig.co не открывается, на RU
в `wg show wg0` рукопожатие устройства старое или «received» не растёт. Германию и ключи устройств сохраняем: людям нужно
будет один раз импортировать новый файл. Ниже `<OLD_RU>` команда входа на старый сервер, `<RU>` на новый.

1. Шаги 4 и 6 этой инструкции: человек заказывает сервер в reg.ru, ты делаешь основу на новом сервере.
2. Перенеси ключи и устройства со старого сервера на новый трубой (с компьютера человека):
   ```bash
   <OLD_RU> 'tar czf - -C / root/vpn etc/wireguard/wg0.conf etc/amnezia/amneziawg' | <RU> 'umask 077; tar xzf - -C /'
   ```
3. На новом сервере: `sed -i 's|^RU_IP=.*|RU_IP=<RU_IP>|' /root/vpn/params.env`. Положи из Приложения `cascade.sh`,
   `add-device.sh`, `remove-device.sh`, `selftest.sh` (замени `<EU_IP>`), `chmod 700`, `bash -n`. Затем блок из 4.1 пункт 3:
   входы на новом сервере ещё не подняты, он поправит только файлы (аварийный стоп и IPv6). Если перенёсся
   `awg_entry.conf`: `ufw allow 8443/udp comment "awg_entry: masked entry"`.
4. Сразу перепиши адрес во всех файлах устройств и двойников (иначе самопроверка будет стучаться на старый сервер):
   ```bash
   cd /root/vpn; sed -i 's|^Endpoint = .*:443$|Endpoint = <RU_IP>:443|' clients/*/ru-*.conf
   ls clients/*/ru-awg-*.conf >/dev/null 2>&1 && sed -i 's|^Endpoint = .*:8443$|Endpoint = <RU_IP>:8443|' clients/*/ru-awg-*.conf
   grep -h ^Endpoint clients/*/ru-*.conf | sort | uniq -c
   ```
5. **Отключи старый сервер от Германии** (у старого и нового один ключ связи: работать одновременно они не могут). Скажи
   человеку: «Со следующей минуты старый VPN перестанет давать интернет, новые файлы будут через 10 минут.» Затем:
   ```bash
   <OLD_RU> 'systemctl disable --now awg-quick@awg_europe; systemctl disable --now wg-quick@wg0; systemctl disable --now awg-quick@awg_entry 2>/dev/null; true'
   ```
6. На EU разреши новый адрес: `. /root/vpn/params.env; iptables -A INPUT -s <RU_IP>/32 -p udp --dport $C_PORT -j ACCEPT; netfilter-persistent save`.
   На новом RU: `systemctl enable --now wg-quick@wg0 awg-quick@awg_europe` (и `awg-quick@awg_entry`, если он есть).
   Сразу после этого блок из 4.1 пункт 4 (IPv6 в файлах устройств). Затем шаги 8 и 9 этой инструкции: PASS.
7. Шаг 10: забери файлы устройств к человеку (`scp`) и раздай людям. Людям: удалить старый туннель, импортировать новый файл.
   Туннели из панели WGDashboard в `clients/` не лежат: этим людям новые файлы через `./add-device.sh <имя>`.
8. Когда все переехали: на EU убери правило старого адреса (`. /root/vpn/params.env; iptables -D INPUT -s <старый RU_IP>/32 -p udp
   --dport $C_PORT -j ACCEPT; netfilter-persistent save`), старый сервер человек удаляет в кабинете старого хостинга.

---

## Приложение. Файлы дословно

Все файлы с нашего работающего RU-сервера. Замени метки: `<EU_IP>` в `selftest.sh`.

### RU: /root/vpn/cascade.sh

```bash
#!/bin/bash
# Cascade per the programmer's recipe, line by line. Run by awg_europe PostUp/PostDown.
# up:   packets from the VPN entries get fwmark 0x65 -> ip rule -> table vpn_table -> default dev awg_europe
# down: all of it removed; then the kill switch in each entry's PostUp rejects traffic: devices get no internet.
# Implied by the recipe, needed to work: NAT on awg_europe, forward entry <-> awg_europe, MSS clamp (tunnel in tunnel).
# Entries: wg0 = WireGuard, in use; awg_entry = AmneziaWG masked entry, only if it was set up (part 3).
ENTRIES="wg0 awg_entry"
ACT=${1:?usage: cascade.sh up|down}
[ -f /etc/iproute2/rt_tables.bak-neovida ] || cp -fp /etc/iproute2/rt_tables /etc/iproute2/rt_tables.bak-neovida
grep -qE "^[0-9]+[[:space:]]+vpn_table$" /etc/iproute2/rt_tables || printf '101\tvpn_table\n' >> /etc/iproute2/rt_tables
if [ "$ACT" = up ]; then "$0" down >/dev/null 2>&1; set -e; O=-A; I=-I; R=add; else O=-D; I=-D; R=del; fi  # up starts clean
for E in $ENTRIES; do iptables -t mangle $O PREROUTING -i $E -j MARK --set-mark 0x65; done
ip rule $R from all fwmark 0x65 lookup vpn_table
ip route $R default dev awg_europe table vpn_table 2>/dev/null || [ $R = del ]  # recipe says "via awg_europe": via wants an address
iptables -t nat $O POSTROUTING -o awg_europe -j MASQUERADE
for E in $ENTRIES; do
  iptables $I FORWARD -i $E -o awg_europe -j ACCEPT
  iptables $I FORWARD -i awg_europe -o $E -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
  iptables -t mangle $O FORWARD -o $E -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
done
iptables -t mangle $O FORWARD -o awg_europe -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
exit 0
```

### RU: /root/vpn/add-device.sh

```bash
#!/bin/bash
# Adds one device to the cascade entry (WireGuard wg0 on the RU server). Usage: add-device.sh <name>  (a-z 0-9 -)
# The device gets IPv4 and an internal IPv6 with AllowedIPs 0.0.0.0/0, ::/0, so its own IPv6 cannot leak past the VPN.
set -euo pipefail
NAME="${1:?usage: add-device.sh <name>}"
[[ "$NAME" =~ ^[a-z0-9-]{1,20}$ ]] || { echo "name: a-z0-9- only, max 20"; exit 1; }
cd /root/vpn; . ./params.env
OUT=clients/$NAME
[ -e "$OUT" ] && { echo "device $NAME already exists"; exit 1; }
W=/etc/wireguard/wg0.conf
N=2; while grep -q "10\.70\.70\.$N/32" $W; do N=$((N+1)); done
[ $N -le 254 ] || { echo "no free addresses"; exit 1; }
umask 077; mkdir -p "$OUT"
cp -fp "$W" "$W.bak-$(date +%Y%m%d%H%M%S)"
CP=$(wg genkey); CPUB=$(echo "$CP" | wg pubkey); PSK=$(wg genpsk)
printf '\n[Peer]\n#Name# = %s\nPublicKey = %s\nPresharedKey = %s\nAllowedIPs = 10.70.70.%s/32, fd70:70:70::%s/128\n' "$NAME" "$CPUB" "$PSK" "$N" "$N" >> $W
cat > "$OUT/ru-$NAME.conf" <<C
[Interface]
PrivateKey = $CP
Address = 10.70.70.$N/32, fd70:70:70::$N/128
DNS = 1.1.1.1, 8.8.8.8
MTU = 1300

[Peer]
PublicKey = $W_PUB
PresharedKey = $PSK
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = $RU_IP:$W_PORT
PersistentKeepalive = 25
C
wg syncconf wg0 <(wg-quick strip wg0)
echo "added $NAME (#$N): $OUT/ru-$NAME.conf"
```

### RU: /root/vpn/remove-device.sh

```bash
#!/bin/bash
# Disconnects one device from the cascade entry (wg0). Usage: remove-device.sh <name>
# "wg-quick save" drops the name comments from wg0.conf, so the peer is found by the public key from clients/<name>/.
set -euo pipefail
NAME="${1:?usage: remove-device.sh <name>}"
[[ "$NAME" =~ ^[a-z0-9-]{1,20}$ ]] || { echo "invalid name"; exit 1; }
cd /root/vpn
cp -fp /etc/wireguard/wg0.conf /etc/wireguard/wg0.conf.bak-$(date +%Y%m%d%H%M%S)
F=clients/$NAME/ru-$NAME.conf
[ -f "$F" ] || { echo "no device $NAME in clients/"; exit 1; }
PUB=$(grep ^PrivateKey "$F" | cut -d= -f2- | tr -d ' ' | wg pubkey)
wg set wg0 peer "$PUB" remove
wg-quick save wg0
mkdir -p clients/_removed; [ -d clients/$NAME ] && mv -f clients/$NAME clients/_removed/$NAME-$(date +%Y%m%d%H%M)
echo "removed $NAME"
```

### RU: /root/vpn/selftest.sh

```bash
#!/bin/bash
# End-to-end self test of the cascade. Prints PASS/FAIL.
# A "device twin" in a network namespace connects to wg0 like a real device; its traffic must reach the internet
# from the EU server (<EU_IP>), never from Russia. If the masked entry awg_entry was set up, twin-awg checks it too.
cd /root/vpn; . ./params.env
DE_IP=<EU_IP>; WAN=$(ip route show default | awk '{print $5; exit}'); RES=0
pass() { echo "PASS  $1"; }; fail() { echo "FAIL  $1"; RES=1; }
AWG_ENTRY=0; [ -f /etc/amnezia/amneziawg/awg_entry.conf ] && AWG_ENTRY=1
echo "kernel $(uname -r); WAN $WAN; services: $(systemctl is-active wg-quick@wg0 awg-quick@awg_europe | tr '\n' ' ')"
# link to Europe
HS=$(awg show awg_europe latest-handshakes 2>/dev/null | awk '{print $2}'); AGE=$(( $(date +%s) - ${HS:-0} ))
[ "${HS:-0}" -gt 0 ] && [ $AGE -lt 180 ] && pass "awg_europe handshake ${AGE}s ago" || fail "awg_europe no fresh handshake"
ip=$(curl -4 -s --max-time 15 --interface awg_europe https://ifconfig.co)
[ "$ip" = "$DE_IP" ] && pass "awg_europe exit $ip" || fail "awg_europe exit (got '$ip')"
# the recipe's pieces are in place
iptables -t mangle -C PREROUTING -i wg0 -j MARK --set-mark 0x65 2>/dev/null \
  && ip rule | grep -q "fwmark 0x65 lookup vpn_table" \
  && ip route show table vpn_table | grep -q "default dev awg_europe" \
  && pass "mark 0x65 -> vpn_table -> awg_europe" || fail "cascade rules missing"
# kill switch: nothing from the entries goes out of Russia
KS=1
for E in wg0 $([ $AWG_ENTRY = 1 ] && echo awg_entry); do
  iptables -C FORWARD -i $E -o $WAN -j REJECT --reject-with icmp-net-unreachable 2>/dev/null || KS=0
  ip6tables -C FORWARD -i $E -j REJECT --reject-with icmp6-adm-prohibited 2>/dev/null || KS=0
done
iptables -t nat -S POSTROUTING | grep -q -- "-o $WAN" && KS=0
[ $KS = 1 ] && pass "kill switch (IPv4 to $WAN and all IPv6 rejected, no NAT to $WAN)" || fail "kill switch rules"
# device twins: name, link type, tool, config
twin() {
  ip netns del tw 2>/dev/null; ip link del th 2>/dev/null
  ip netns add tw; ip link add th type veth peer name tc; ip link set tc netns tw
  ip addr add 10.201.0.1/30 dev th; ip link set th up
  ip netns exec tw ip addr add 10.201.0.2/30 dev tc; ip netns exec tw ip link set tc up
  ip netns exec tw ip route add $RU_IP/32 via 10.201.0.1
  mkdir -p /etc/netns/tw; echo "nameserver 1.1.1.1" > /etc/netns/tw/resolv.conf
  A4=$(grep ^Address $4 | grep -oE "10\.[0-9.]+")
  ip netns exec tw ip link add wgc type $2
  ip netns exec tw $3 setconf wgc <($3-quick strip $4)
  ip netns exec tw ip addr add $A4/32 dev wgc; ip netns exec tw ip link set mtu 1300 up dev wgc
  ip netns exec tw ip route replace default dev wgc
  ip=$(ip netns exec tw curl -4 -s --max-time 15 https://ifconfig.co)
  [ "$ip" = "$DE_IP" ] && pass "$1 exits from Europe ($ip)" || fail "$1 (got '$ip', want $DE_IP)"
  ip netns exec tw ip link del wgc; ip netns del tw; ip link del th 2>/dev/null; rm -rf /etc/netns/tw
}
[ -f clients/twin/ru-twin.conf ] || ./add-device.sh twin >/dev/null
twin "twin (WireGuard wg0)" wireguard wg clients/twin/ru-twin.conf
if [ $AWG_ENTRY = 1 ]; then
  if [ -f clients/twin-awg/ru-awg-twin-awg.conf ]; then
    twin "twin-awg (AmneziaWG awg_entry)" amneziawg awg clients/twin-awg/ru-awg-twin-awg.conf
  else fail "twin-awg config missing (clients/twin-awg/)"; fi
fi
exit $RES
```

### RU: /root/vpn/setup-awg-entry.sh (только для части 3, «Провайдер режет WireGuard до Москвы»)

```bash
#!/bin/bash
# One-off setup of the masked entry awg_entry next to wg0, which stays untouched.
# AmneziaWG with a QUIC-like first packet (I1), junk packets, padding S1-S4, header ranges H1-H4.
# Kill switch and IPv6 as on wg0. Also creates twin-awg for selftest. Safe to re-run: skips what exists.
set -euo pipefail
cp -fp /root/vpn/params.env /root/vpn/params.env.bak-$(date +%Y%m%d%H%M%S)
cd /root/vpn; . ./params.env
WAN=$(ip route show default | awk '{print $5; exit}')
r() { shuf -i $1-$2 -n 1; }
if ! grep -q "^N_PORT=" params.env; then
  while :; do
    S1=$(r 15 150); S2=$(r 15 150); S3=$(r 12 64); S4=$(r 12 32)
    [ $S2 -ne $((S1+56)) ] && [ $S1 -ne $((S2+56)) ] && [ $((92+S2)) -ne $((64+S3)) ] && break
  done
  H=(); for i in 1 2 3 4; do  # four starts at least 5M apart; each range is 1-3M wide, so none overlap
    while :; do s=$(r 100000000 2000000000); ok=1
      for x in ${H[@]+"${H[@]}"}; do d=$((s - x)); [ ${d#-} -lt 5000000 ] && ok=0; done
      [ $ok = 1 ] && break; done; H+=("$s"); done
  K=$(awg genkey); umask 077
  cat >> params.env <<E
# Masked entry awg_entry (AmneziaWG, QUIC-like first packet)
N_PORT=8443
N_PRIV=$K
N_PUB=$(echo "$K" | awg pubkey)
N_S1=$S1
N_S2=$S2
N_S3=$S3
N_S4=$S4
N_H1=${H[0]}-$(( H[0] + $(r 1000000 3000000) ))
N_H2=${H[1]}-$(( H[1] + $(r 1000000 3000000) ))
N_H3=${H[2]}-$(( H[2] + $(r 1000000 3000000) ))
N_H4=${H[3]}-$(( H[3] + $(r 1000000 3000000) ))
N_I1='<b 0xcd0000000108><r 8><b 0x000044d0><r 1000><r 232>'
E
  . ./params.env
fi
F=/etc/amnezia/amneziawg/awg_entry.conf
AWG="Jc = 4
Jmin = 40
Jmax = 120
S1 = $N_S1
S2 = $N_S2
S3 = $N_S3
S4 = $N_S4
H1 = $N_H1
H2 = $N_H2
H3 = $N_H3
H4 = $N_H4
I1 = $N_I1"
if [ ! -f $F ]; then umask 077; cat > $F <<C
# Masked cascade entry: AmneziaWG, clients send a QUIC-like first packet (I1).
# Its packets go to Europe via /root/vpn/cascade.sh like wg0. Kill switch: nothing goes out of Russia.
[Interface]
PrivateKey = $N_PRIV
Address = 10.71.71.1/24, fd71:71:71::1/64
ListenPort = $N_PORT
MTU = 1300
$AWG
PostUp = iptables -I FORWARD -i awg_entry -o $WAN -j REJECT --reject-with icmp-net-unreachable; ip6tables -I FORWARD -i awg_entry -j REJECT --reject-with icmp6-adm-prohibited
PostDown = iptables -D FORWARD -i awg_entry -o $WAN -j REJECT --reject-with icmp-net-unreachable; ip6tables -D FORWARD -i awg_entry -j REJECT --reject-with icmp6-adm-prohibited
C
fi
TC=clients/twin-awg/ru-awg-twin-awg.conf
APPEND_PEER=0
if [ -f "$TC" ]; then
  CP=$(grep '^PrivateKey' "$TC" | cut -d= -f2- | tr -d ' ')
  CPUB=$(printf '%s\n' "$CP" | awg pubkey)
  PSK=$(grep '^PresharedKey' "$TC" | cut -d= -f2- | tr -d ' ')
  if ! awk -v pub="$CPUB" '$1=="PublicKey" && $2=="=" && $3==pub { found=1 } END { exit !found }' "$F"; then
    grep -qE '10\.71\.71\.2/32([,[:space:]]|$)' "$F" && { echo 'twin address already belongs to another peer'; exit 1; }
    APPEND_PEER=1
  fi
else
  grep -qE '10\.71\.71\.2/32([,[:space:]]|$)' "$F" && { echo 'twin client missing but address occupied; stop'; exit 1; }
  mkdir -p clients/twin-awg; umask 077
  CP=$(awg genkey); CPUB=$(echo "$CP" | awg pubkey); PSK=$(awg genpsk)
  APPEND_PEER=1
  cat > clients/twin-awg/ru-awg-twin-awg.conf <<C
[Interface]
PrivateKey = $CP
Address = 10.71.71.2/32
DNS = 1.1.1.1, 8.8.8.8
MTU = 1300
$AWG

[Peer]
PublicKey = $N_PUB
PresharedKey = $PSK
AllowedIPs = 0.0.0.0/0
Endpoint = $RU_IP:$N_PORT
PersistentKeepalive = 25
C
fi
if [ "$APPEND_PEER" = 1 ]; then
  cp -fp "$F" "$F.bak-$(date +%Y%m%d%H%M%S)"
  printf '\n[Peer]\n#Name# = twin-awg\nPublicKey = %s\nPresharedKey = %s\nAllowedIPs = 10.71.71.2/32\n' "$CPUB" "$PSK" >> "$F"
fi
if ip link show awg_entry >/dev/null 2>&1; then
  awg syncconf awg_entry <(awg-quick strip awg_entry)
fi
echo "awg_entry: port $N_PORT, S $N_S1/$N_S2/$N_S3/$N_S4, H1 $N_H1, public key $N_PUB"
```

### RU: /root/vpn/add-awg.sh (только для части 3)

```bash
#!/bin/bash
# Adds one device to the masked entry awg_entry (AmneziaWG, 8443/udp, QUIC-like first packet).
# For networks that cut plain WireGuard (mobile operators). Usage: add-awg.sh <name>  (a-z 0-9 -)
# Client file: clients/<name>/ru-awg-<name>.conf, import into the AmneziaWG app (file or QR).
set -euo pipefail
NAME="${1:?usage: add-awg.sh <name>}"
[[ "$NAME" =~ ^[a-z0-9-]{1,20}$ ]] || { echo "name: a-z0-9- only, max 20"; exit 1; }
cd /root/vpn; . ./params.env
OUT=clients/$NAME
[ -e "$OUT" ] && { echo "client $NAME already exists"; exit 1; }
F=/etc/amnezia/amneziawg/awg_entry.conf
N=2; while grep -qE "10\.71\.71\.$N/32([,[:space:]]|$)" $F; do N=$((N+1)); done
[ $N -le 254 ] || { echo "no free addresses"; exit 1; }
cp -p $F $F.bak-$(date +%Y%m%d%H%M%S)
umask 077; mkdir -p "$OUT"
CP=$(awg genkey); CPUB=$(echo "$CP" | awg pubkey); PSK=$(awg genpsk)
printf '\n[Peer]\n#Name# = %s\nPublicKey = %s\nPresharedKey = %s\nAllowedIPs = 10.71.71.%s/32, fd71:71:71::%s/128\n' "$NAME" "$CPUB" "$PSK" "$N" "$N" >> $F
cat > "$OUT/ru-awg-$NAME.conf" <<C
[Interface]
PrivateKey = $CP
Address = 10.71.71.$N/32, fd71:71:71::$N/128
DNS = 1.1.1.1, 8.8.8.8
MTU = 1300
Jc = 4
Jmin = 40
Jmax = 120
S1 = $N_S1
S2 = $N_S2
S3 = $N_S3
S4 = $N_S4
H1 = $N_H1
H2 = $N_H2
H3 = $N_H3
H4 = $N_H4
I1 = $N_I1

[Peer]
PublicKey = $N_PUB
PresharedKey = $PSK
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = $RU_IP:$N_PORT
PersistentKeepalive = 25
C
awg syncconf awg_entry <(awg-quick strip awg_entry)
echo "added $NAME (#$N): $OUT/ru-awg-$NAME.conf"
```

### Автор схемы

Схема каскада: программист школы Олега, работает с 23 сен 2026. Версии 1 и 2: инструкция Олега. Версия 3: сборка Неовиды,
переезд на reg.ru и закрытие IPv6, 11 окт 2026.
